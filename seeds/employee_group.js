exports.seed = function(knex) {
  let groups = `1|Executive board
2|Senior executives
3|Executives
4|Exempt employees
10|White Collar
20|Blue Collar
30|wage/Blue Collar Mth
70|Apprentices white C.
71|Apprentices blue C.
75|Interns/Diploma Stud
76|Working Students
78|Trainees
E1|Leasing`;

  return knex.raw('TRUNCATE employee_group RESTART IDENTITY').then(function() {
    let insert = [];
    groups.split('\n').forEach(function(row) {
      let split = row.split('|');
      insert.push({
        company_id: split[0],
        name: split[1],
      });
    });

    return knex('employee_group').insert(insert);
  });
};
