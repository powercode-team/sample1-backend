import Model from './Model';

class Recommendation extends Model {
  static get STATUS_ENVELOP() {
    return 1;
  }

  static get STATUS_DIALOG() {
    return 2;
  }

  static get STATUS_HANDSHAKE() {
    return 3;
  }

  static get STATUS_MONEY() {
    return 4;
  }

  static get STATUS_NO_MONEY() {
    return 5;
  }

  static get tableName() {
    return 'recommendations';
  }
}

export default Recommendation;
module.exports = Recommendation;
