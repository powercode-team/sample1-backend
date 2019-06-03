import ReportService from '../../../services/ReportService';

const moment = require('moment');
export default async ctx => {
  let from = moment().startOf('month');
  let to = moment();
  ctx.response.body = await ReportService.monthly(from, to, true);
  ctx.response.attachment(ReportService.formatFilenameWithDate(`monthly_rewards_report`));
};
