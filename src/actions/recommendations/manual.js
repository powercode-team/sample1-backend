import ResponseService from './../../services/ResponseService';
import RecommendationService from '../../services/RecommendationService';
import Reward from '../../models/Reward';
import Recommendation from '../../models/Recommendation';
import BaseService from '../../services/BaseService';

const _ = require('lodash');
const moment = require('moment');

export default async ctx => {
  const id = parseInt(ctx.request.body.id || 0, 10);
  const accepted = ctx.request.body.accepted;

  if (!_.isNumber(id)) {
    return ResponseService.error(ctx, 'Parameter ID must be an integer', 422);
  }

  if (!_.isBoolean(accepted)) {
    return ResponseService.error(ctx, 'Parameter accepted must be a boolean', 422);
  }

  let recommendation = await RecommendationService.findByID(id);

  if (!recommendation) {
    return ResponseService.error(ctx, 'Recommendation not exists', 404);
  }

  if (recommendation.manual_checked) {
    return ResponseService.success(ctx, [], 204);
  }

  await Recommendation.query()
    .where('id', recommendation.id)
    .update({
      manual_checked: accepted,
    });

  let reward = await Reward.query()
    .where('recommendation_id', recommendation.id)
    .first();
  if (!reward || reward.decision_date) {
    return ResponseService.success(ctx, [], 204);
  }

  await Reward.query()
    .where('id', reward.id)
    .update({
      decision_date: moment().format(BaseService.DATE_FORMAT),
    });

  ResponseService.success(ctx, [], 204);
};
