import Recommendation from '../../models/Recommendation';
import ResponseService from '../../services/ResponseService';
import EncryptionService from '../../services/EncryptionService';
import EmailService from '../../services/EmailService';
import BaseService from '../../services/BaseService';

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

const moment = require('moment');
const _ = require('lodash');

export default async ctx => {
  const account = ctx.state.account;
  const send = ctx.request.body.send;

  if (send) {
    let crypted = EncryptionService.encrypt(
      JSON.stringify({
        id: account.id,
        moment: moment().unix(),
      }),
    );

    let approvement_deletion = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'templates', 'deleteMail.hbs'),
      'utf8',
    );

    let data = {
      first_name: ctx.state.account.first_name,
      delete_url: process.env.APP_URL + 'deletion/' + crypted,
    };

    console.log(data);
    let message = handlebars.compile(approvement_deletion)(data);

    await EmailService.sendEmail(account.email, 'Hire4Friends deletion approvement', message);
    return ResponseService.success(ctx, null, 204);
  }

  let count = (await Recommendation.query()
    .leftJoin('rewards', 'rewards.recommendation_id', '=', 'recommendations.id')
    .where('recommendations.recommender_id', account.id)
    .where(function() {
      this.whereNotIn('recommendations.status', [
        Recommendation.STATUS_ENVELOP,
        Recommendation.STATUS_NO_MONEY,
      ]).orWhereNot('rewards.accepted', false);
    })
    .countDistinct('recommendations.id'))[0].count;

  if (_.parseInt(count)) {
    return ResponseService.error(ctx, 'User has recommendations in progress', 409);
  }

  await BaseService.axios.post(
    'auth/profile/delete',
    {},
    {
      headers: {
        'application-id': BaseService.APPLICATION,
        [BaseService.HEADER]: ctx.response.headers[BaseService.HEADER],
      },
    },
  );

  const date = moment().unix();

  await Recommendation.query()
    .update({
      recommender_first_name: null,
      recommender_last_name: null,
      email: Recommendation.knex().raw('md5(lower(??))', ['email']),
      recommender_id: date * -1,
    })
    .where('recommender_id', account.id);

  return ResponseService.success(ctx, null, 204);
};
