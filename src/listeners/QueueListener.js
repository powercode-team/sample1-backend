import BaseListener from './BaseListener';
import BaseService from '../services/BaseService';
import RecommendationService from '../services/RecommendationService';
import Recommendation from '../models/Recommendation';
import EmailService from '../services/EmailService';
import EmployeeService from '../services/EmployeeService';
import Reward from '../models/Reward';
import Rule from '../models/Rule';
import Grade from '../models/Grade';
import FunctionalArea from '../models/FunctionalArea';
import EmployeeGroup from '../models/EmployeeGroup';
import Setting from '../models/Setting';

const moment = require('moment');
const _ = require('lodash');

class QueueListener extends BaseListener {
  constructor() {
    super();
  }

  static async processApplicant(job) {
    let applicant = job.data.applicant;

    let recommendation = await RecommendationService.findRecommendation(applicant.email, applicant.applied_for_job_id);

    console.log('ApplicantEvent: recommendation:', recommendation);

    if (!recommendation || recommendation.rejected) {
      return;
    }

    let employee = await EmployeeService.getByID(recommendation.recommender_id);

    console.log('ApplicantEvent: recommendation:employee', employee);

    let obj = {};

    if (applicant.date_applied) {
      obj.date_applied = applicant.date_applied;
    }

    try {
      if (!_.isEmpty(obj)) {
        await Recommendation.query()
          .where('id', recommendation.id)
          .update(obj);
      }
    } catch (e) {}

    if (!recommendation.applicant_id) {
      obj.applicant_id = applicant.id;
      obj.applicant_job_title = applicant.applied_for_jobtitle;

      await EmailService.send('applied', employee, applicant);
    }

    let accepted_date;
    let rejected_date;

    try {
      accepted_date = moment(applicant.hired_date);
      rejected_date = moment(applicant.rejected_date);
    } catch (e) {}

    let accepted = null;

    if (accepted_date.isValid() && rejected_date.isValid()) {
      if (accepted_date.isAfter(rejected_date)) {
        accepted = true;
      }

      if (rejected_date.isSameOrAfter(accepted_date)) {
        accepted = false;
      }
    } else {
      if (accepted_date.isValid()) {
        accepted = true;
      }

      if (rejected_date.isValid()) {
        accepted = false;
      }
    }

    console.log('ApplicantEvent: recommendation:accepted', accepted);

    if (null === recommendation.accepted && true === accepted) {
      obj.accepted = accepted_date.format(BaseService.DATE_FORMAT);

      await EmailService.send('accepted', employee, applicant);
    }

    if (false === accepted) {
      obj.rejected = true;
      obj.applicant_id = null;

      await EmailService.send('rejected', employee, applicant);
    }

    if (parseInt(recommendation.status, 10) < Recommendation.STATUS_DIALOG && applicant.date_applied) {
      obj.status = Recommendation.STATUS_DIALOG;

      /**
       * Apply counter
       */
      try {
        await BaseService.axios.post(
          'increments/apply',
          {
            id: applicant.applied_for_job_id,
          },
          {
            headers: {
              'application-id': BaseService.APPLICATION,
            },
          },
        );
      } catch (e) {}
    }

    console.log('ApplicantEvent: recommendation:obj', obj);

    if (Object.keys(obj).length) {
      await Recommendation.query()
        .where('id', recommendation.id)
        .update(obj);
    }
  }

  static async processDeletedEmployee(job) {
    let employee = job.data.employee;

    let recommendation = await Recommendation.query()
      .where('employee_id', employee.id)
      .where('job_id', employee.employee_job_id)
      .first();

    if (!recommendation) {
      return Promise.resolve();
    }

    let status = recommendation.status;

    try {
      if (
        moment(employee.start_date_of_work_contract)
          .add(Reward.MONTHS, 'months')
          .isAfter(moment())
      ) {
        status = Recommendation.STATUS_NO_MONEY;
      }
    } catch (e) {
      console.log('Moment error', e);
    }

    try {
      await Recommendation.query()
        .where('id', recommendation.id)
        .update({
          status,
          reason: JSON.stringify([
            'Your recommendation is not valid for a reward because your friend left the company.',
          ]),
        });

      if (Recommendation.STATUS_NO_MONEY === status) {
        await Reward.query()
          .where('recommendation_id', recommendation.id)
          .update({
            decision_date: moment().format(BaseService.DATE_FORMAT),
            accepted: false,
          });
      }

      await Recommendation.query()
        .where('recommender_id', employee.id)
        .orWhere('employee_id', employee.id)
        .update({
          employee_id: 0,
          status,
        });

      let recommender = await EmployeeService.getByID(recommendation.recommender_id, true);
      await EmailService.deleted(recommender, employee);
    } catch (e) {
      console.log('Update error', e);
    }

    return Promise.resolve();
  }

  static async processDeletedAppUser(job) {
    let employee = job.data.employee;

    await Reward.query()
      .join('recommendations', 'recommendations.id', '=', 'rewards.recommendation_id')
      .where('recommendations.recommender_id', employee.id)
      .delete();
    await Recommendation.query()
      .where('recommender_id', employee.id)
      .delete();
    await Filter.query()
      .where('account_id', employee.id)
      .delete();
    await Setting.query()
      .where('employee_id', employee.id)
      .delete();

    return Promise.resolve();
  }

  static async processApplicantEmployee(job) {
    let employee = job.data.employee;
    let applicant = job.data.applicant;

    let recommendation = await RecommendationService.findRecommendation(applicant.email, applicant.applied_for_job_id);

    console.log('ApplicantEmployeeEvent: recommendation', recommendation);

    if (!recommendation) {
      return Promise.resolve();
    }

    let updateObject = {};

    if (null === recommendation.employee_id) {
      updateObject.employee_id = employee.id;
    }

    if (null === recommendation.date_applied) {
      updateObject.date_applied = applicant.date_applied;
    }

    if (null === recommendation.start_date_of_work_contract) {
      updateObject.start_date_of_work_contract = employee.start_date_of_work_contract;
    }

    try {
      if (!_.isEmpty(updateObject)) {
        await Recommendation.query()
          .where('id', recommendation.id)
          .update(updateObject);
      }
    } catch (e) {}

    if (_.parseInt(recommendation.status) < Recommendation.STATUS_HANDSHAKE && applicant.hired_date) {
      await Recommendation.query()
        .where('id', recommendation.id)
        .update({
          status: Recommendation.STATUS_HANDSHAKE,
        });

      /**
       * Trend counter
       */
      try {
        await BaseService.axios.post(
          'increments/trend',
          {
            id: employee.employee_job_id,
          },
          {
            headers: {
              'application-id': BaseService.APPLICATION,
            },
          },
        );
      } catch (e) {}
    }

    let reward = await Reward.query()
      .where('recommendation_id', recommendation.id)
      .first();
    if (reward) {
      return Promise.resolve();
    }

    try {
      let recommendation_date = moment(recommendation.recommendation_date);
      let applied_date = moment(applicant.date_applied);
      if (
        recommendation_date
          .clone()
          .add(Reward.DAYS, 'days')
          .isSameOrAfter(applied_date)
      ) {
        console.log('EmployeeEvent: ' + Reward.DAYS + ' days', true);

        let recommender = await EmployeeService.getByID(recommendation.recommender_id);

        console.log('EmployeeEvent: recommender', recommender);

        if (!recommender) {
          return Promise.resolve();
        }

        let recommender_grade =
          (await Grade.query()
            .where('grade', _.toString(recommender.grade))
            .first()) || {};
        console.log('EmployeeEvent: recommender_grade', recommender_grade);
        let recommender_functional_area =
          (await FunctionalArea.query()
            .where('name', recommender.functional_area)
            .first()) || {};
        console.log('EmployeeEvent: recommender_functional_area', recommender_functional_area);
        let friend_employee_group =
          (await EmployeeGroup.query()
            .where('name', employee.employee_group)
            .first()) || {};
        console.log('EmployeeEvent: friend_employee_group', friend_employee_group);
        let rule = null;
        try {
          rule = await Rule.query()
            .where('recommender_grade', recommender_grade.id)
            .orWhere('recommender_functional_area', recommender_functional_area.id)
            .orWhere('friend_employee_group', friend_employee_group.id)
            .first();
        } catch (e) {}

        console.log('EmployeeEvent: rule', rule);

        if (rule) {
          await Recommendation.query()
            .where('id', recommendation.id)
            .update({
              automatic_rejection_date: moment().format(BaseService.DATE_FORMAT),
              status: Recommendation.STATUS_NO_MONEY,
              reason: JSON.stringify([
                '- your grade is YYY <br />'.replace('YYY', recommender_grade.grade || 'none') +
                  '- your functional area is ZZZ '.replace('ZZZ', recommender_functional_area.name || 'none') +
                  "- your friend's employee group is XXX <br />".replace('XXX', friend_employee_group.name || 'none'),
              ]),
            });
          return Promise.resolve();
        }

        if (_.parseInt(recommender.id) === _.parseInt(employee.superior_id)) {
          await Recommendation.query()
            .where('id', recommendation.id)
            .update({
              automatic_rejection_date: moment().format(BaseService.DATE_FORMAT),
              status: Recommendation.STATUS_NO_MONEY,
              reason: JSON.stringify([
                'Your recommendation is not valid for a reward because you are a direct superior of your friends.',
              ]),
            });
          return Promise.resolve();
        }

        const FTE = Number.parseFloat(employee.fte);
        let fte = 1;
        if (_.isFinite(FTE)) {
          fte = FTE;
        }

        await Reward.query().insert({
          recommendation_id: recommendation.id,
          /*
          * Old formula
          * amount: parseInt(((employee.working_hours || 0) / 40 * 2000), 10),
          */
          amount: _.parseInt(fte * 2000, 10),
          date_fulfilled: moment(employee.start_date_of_work_contract)
            .add(Reward.MONTHS, 'months')
            .format(BaseService.DATE_FORMAT),
        });

        console.log('EmployeeEvent: recommendation:reward', true);
      } else {
        let days = Math.abs(recommendation_date.diff(applied_date, 'days')).toString();
        await Recommendation.query()
          .where('id', recommendation.id)
          .update({
            automatic_rejection_date: moment().format(BaseService.DATE_FORMAT),
            status: Recommendation.STATUS_NO_MONEY,
            reason: JSON.stringify([
              'Your recommendation is not valid for a reward because your friend applied after XXX days.'.replace(
                'XXX',
                days,
              ),
            ]),
          });

        console.log('EmployeeEvent: ' + Reward.DAYS + ' days', false);
      }
    } catch (e) {
      console.log(e);
    }

    return Promise.resolve();
  }

  static async processEightMonths(job) {
    let employee = job.data.employee;

    let recommendation = await Recommendation.query()
      .where('employee_id', employee.id)
      .where('job_id', employee.employee_job_id)
      .first();

    if (recommendation) {
      try {
        let recommender = await EmployeeService.getByID(recommendation.recommender_id, true);
        await EmailService.completed(recommender, employee);
      } catch (e) {}
    }

    return Promise.resolve();
  }

  async run() {
    console.log('Running processing of queue...');

    try {
      this.queue.process(async job => {
        console.log(`Processing job ${job.id}, type ${job.data.type}`);
        console.log(job.data);
        switch (job.data.type) {
          case 'applicant':
            return QueueListener.processApplicant(job);
          case 'applicant-employee':
            return QueueListener.processApplicantEmployee(job);
          case 'deleted-employee':
            return QueueListener.processDeletedEmployee(job);
          case 'deleted-app-user':
            return QueueListener.processDeletedAppUser(job);
          case 'eight-months':
            return QueueListener.processEightMonths(job);
          default:
            return Promise.resolve();
        }
      });
    } catch (e) {
      console.log(e);
    }
  }
}

export default QueueListener;
