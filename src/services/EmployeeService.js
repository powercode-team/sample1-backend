import BaseService from './BaseService';

class EmployeeService extends BaseService {
  constructor() {
    super();
  }

  static async getByID(id, force) {
    let employee = false;

    if (!id) {
      return employee;
    }

    try {
      let response = await BaseService.axios.get('auth/profile/by/id/' + id + (force ? '/1' : ''), {
        headers: {
          'application-id': BaseService.APPLICATION,
        },
      });

      employee = response.data.data.account;
    } catch (e) {}

    return employee;
  }
}

export default EmployeeService;
