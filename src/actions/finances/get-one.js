import ResponseService from './../../services/ResponseService';
import RecommendationService from './../../services/RecommendationService';
import EmployeeService from '../../services/EmployeeService';

const _ = require('lodash');

export default async ctx => {
  const id = _.parseInt(ctx.params.id || 0, 10);

  if (!_.isNumber(id) || !id) {
    return ResponseService.error(ctx, 'Parameter ID must be an integer', 422);
  }

  let recommendation = await RecommendationService.getOne(id);

  if (!recommendation) {
    return ResponseService.error(ctx, 'Recommendation not exists', 404);
  }

  let recommender = null;
  let friend = null;

  try {
    recommender = await EmployeeService.getByID(recommendation.recommender_id);
    friend = await EmployeeService.getByID(recommendation.employee_id, true);
  } catch (e) {}

  ResponseService.success(ctx, {
    recommendation,
    recommender: recommender || null,
    friend: friend || null,
  });
};
