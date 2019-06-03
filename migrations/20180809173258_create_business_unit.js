exports.up = async function(knex) {
  if (await knex.schema.hasTable('business_unit')) {
    return;
  }

  await knex.schema.createTable('business_unit', function(table) {
    table.increments();
    table.string('name');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('business_unit');
};
