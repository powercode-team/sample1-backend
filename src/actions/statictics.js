import ResponseService from '../services/ResponseService';
import Reward from '../models/Reward';
import Recommendation from '../models/Recommendation';

export default async ctx => {
  const account = ctx.state.account;

  ResponseService.success(
    ctx,
    {
      total_earned: await Reward.query()
        .select(Reward.knex().raw('sum(amount) as c'))
        .where('rewards.accepted', true)
        .andWhere('recommender_id', account.id)
        .join('recommendations', 'recommendations.id', 'rewards.recommendation_id')
        .first()
        .then(total => {
          return parseInt(total.c || 0);
        }),
      unique_friends: await Recommendation.query()
        .select(Recommendation.knex().raw('count(DISTINCT email) as c'))
        .where('recommender_id', account.id)
        .first()
        .then(total => {
          return parseInt(total.c || 0);
        }),
      total_recommendations: await Recommendation.query()
        .select(Recommendation.knex().raw('count(DISTINCT recommendations.id) as c'))
        .where('recommender_id', account.id)
        .first()
        .then(total => {
          return parseInt(total.c || 0);
        }),
      friends_successfully_recommended: await Recommendation.query()
        .select(Recommendation.knex().raw('count(recommendations.email) as c'))
        .where('recommendations.status', '>=', Recommendation.STATUS_HANDSHAKE)
        .where('accepted', 'is not', null)
        .andWhere('recommender_id', account.id)
        .first()
        .then(total => {
          return parseInt(total.c || 0, 10);
        }),
    },
    200,
  );
};
