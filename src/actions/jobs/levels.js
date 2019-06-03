import ResponseService from '../../services/ResponseService';
import LevelService from '../../services/LevelService';

const _ = require('lodash');

export default async ctx => {
  let levels = await LevelService.all();
  levels = _.map(levels, level => level.name);

  ResponseService.success(
    ctx,
    {
      levels,
    },
    200,
  );
};
