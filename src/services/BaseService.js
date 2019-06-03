require('dotenv').config();

const axios = require('axios');
axios.defaults.baseURL = process.env.LUDI_URI;

const HEADER = 'authorization';

class BaseService {
  static get APPLICATION() {
    return process.env.APP_ID || 0;
  }

  static get HEADER() {
    return HEADER;
  }

  static get DATE_FORMAT() {
    return 'YYYY-MM-DD';
  }

  static get axios() {
    return axios;
  }

  static log(error) {
    if (process.env.APP_ENV !== 'production') {
      console.log(error.message);
    }
  }
}

export default BaseService;
