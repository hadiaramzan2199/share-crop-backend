const pool = require('../../../../db');

function ensureColumns(err, cols) {
  if (err && err.code === '42703') {
    throw Object.assign(new Error(`Schema requires columns: ${cols.join(', ')}`), { status: 500 });
  }
}

async function getProductionConsistency(req, res) {
  try {
    const farmersRes = await pool.query("SELECT id, name, email FROM users WHERE user_type = 'farmer'");
    const farmers = farmersRes.rows;

    const farmsRes = await pool.query("SELECT id, farm_name, owner_id FROM farms");
    const farms = farmsRes.rows;

    let fields;
    try {
      const fieldsRes = await pool.query(
        "SELECT id, name, farm_id, production_rate, production_rate_unit, quantity, harvest_dates, available_area, total_area FROM fields"
      );
      fields = fieldsRes.rows;
    } catch (err) {
      ensureColumns(err, ['fields.production_rate', 'fields.quantity', 'fields.harvest_dates']);
      return res.status(500).json({ error: 'Server Error' });
    }

    const farmsByOwner = new Map();
    for (const farm of farms) {
      const arr = farmsByOwner.get(farm.owner_id) || [];
      arr.push(farm);
      farmsByOwner.set(farm.owner_id, arr);
    }

    const fieldsByFarm = new Map();
    for (const field of fields) {
      const arr = fieldsByFarm.get(field.farm_id) || [];
      arr.push(field);
      fieldsByFarm.set(field.farm_id, arr);
    }

    const result = farmers.map((farmer) => {
      const fFarms = farmsByOwner.get(farmer.id) || [];
      const farmsData = fFarms.map((farm) => {
        const fFields = fieldsByFarm.get(farm.id) || [];
        const stats = aggregateFieldStats(fFields);
        return {
          farm: { id: farm.id, name: farm.farm_name },
          stats,
          fields: fFields.map(fieldToSummary),
        };
      });
      const farmerStats = aggregateFarmStats(farmsData);
      return {
        farmer: { id: farmer.id, name: farmer.name, email: farmer.email },
        stats: farmerStats,
        farms: farmsData,
      };
    });

    res.json({ data: result });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Server Error' });
  }
}

function fieldToSummary(f) {
  const missing = [];
  if (f.production_rate == null) missing.push('production_rate');
  if (f.quantity == null) missing.push('quantity');
  if (f.harvest_dates == null) missing.push('harvest_dates');
  const consistency = {
    hasProductionRate: f.production_rate != null,
    hasQuantity: f.quantity != null,
    hasHarvestDates: f.harvest_dates != null,
    missing,
  };
  return {
    id: f.id,
    name: f.name,
    production_rate: f.production_rate,
    production_rate_unit: f.production_rate_unit,
    quantity: f.quantity,
    available_area: f.available_area,
    total_area: f.total_area,
    consistency,
  };
}

function aggregateFieldStats(fields) {
  let count = fields.length;
  let totalProduction = 0;
  let totalQuantity = 0;
  let missingData = 0;
  for (const f of fields) {
    if (f.production_rate != null) totalProduction += Number(f.production_rate) || 0;
    if (f.quantity != null) totalQuantity += Number(f.quantity) || 0;
    const miss = (f.production_rate == null) || (f.quantity == null) || (f.harvest_dates == null);
    if (miss) missingData++;
  }
  return {
    fieldsCount: count,
    totalProduction,
    totalQuantity,
    missingDataCount: missingData,
  };
}

function aggregateFarmStats(farmsData) {
  let fieldsCount = 0;
  let totalProduction = 0;
  let totalQuantity = 0;
  let missingDataCount = 0;
  for (const fd of farmsData) {
    fieldsCount += fd.stats.fieldsCount;
    totalProduction += fd.stats.totalProduction;
    totalQuantity += fd.stats.totalQuantity;
    missingDataCount += fd.stats.missingDataCount;
  }
  return { fieldsCount, totalProduction, totalQuantity, missingDataCount };
}

module.exports = { getProductionConsistency };
