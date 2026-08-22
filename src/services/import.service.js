const { Worker } = require("worker_threads");
const path = require("path");

const Agent = require("../models/Agent");
const User = require("../models/User");
const Account = require("../models/Account");
const Lob = require("../models/Lob");
const Carrier = require("../models/Carrier");
const Policy = require("../models/Policy");

const runWorker = (filePath) => {
  return new Promise((resolve, reject) => {
    const workerPath = path.resolve(
      __dirname,
      "../workers/policyImport.worker.js"
    );

    const worker = new Worker(workerPath, {
      workerData: {
        filePath,
      },
    });

    worker.on("message", (message) => {
      if (!message.success) {
        reject(new Error(message.error));
        return;
      }

      resolve(message);
    });

    worker.on("error", (error) => {
      reject(error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};

const importPolicies = async (filePath) => {
  const result = await runWorker(filePath);

  const rows = result.rows;

  const agentCache = new Map();
  const userCache = new Map();
  const accountCache = new Map();
  const lobCache = new Map();
  const carrierCache = new Map();

  const policyDocuments = [];

  for (const row of rows) {
    // ---------------- AGENT ----------------
    const agentKey = `${row.agent.name || ""}|${row.agent.agencyId || ""}`;

    let agentId = agentCache.get(agentKey);

    if (!agentId) {
      const agent = await Agent.findOneAndUpdate(
        {
          name: row.agent.name,
          agencyId: row.agent.agencyId,
        },
        {
          $setOnInsert: {
            name: row.agent.name,
            agencyId: row.agent.agencyId,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      agentId = agent._id;
      agentCache.set(agentKey, agentId);
    }

    // ---------------- USER ----------------
    const userKey =
      row.user.email ||
      [
        row.user.firstName,
        row.user.phone,
        row.user.dob ? row.user.dob.toISOString() : "",
      ].join("|");

    let userId = userCache.get(userKey);

    if (!userId) {
      const userFilter = row.user.email
        ? { email: row.user.email }
        : {
            firstName: row.user.firstName,
            phone: row.user.phone,
            dob: row.user.dob,
          };

      const user = await User.findOneAndUpdate(
        userFilter,
        {
          $set: row.user,
        },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        }
      );

      userId = user._id;
      userCache.set(userKey, userId);
    }

    // ---------------- ACCOUNT ----------------
    const accountKey = `${row.account.accountName || ""}|${userId}`;

    let accountId = accountCache.get(accountKey);

    if (!accountId) {
      const account = await Account.findOneAndUpdate(
        {
          accountName: row.account.accountName,
          userId,
        },
        {
          $set: {
            accountType: row.account.accountType,
          },
          $setOnInsert: {
            accountName: row.account.accountName,
            userId,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      accountId = account._id;
      accountCache.set(accountKey, accountId);
    }

    // ---------------- LOB ----------------
    const lobKey = row.lob.categoryName;

    let lobId = lobCache.get(lobKey);

    if (!lobId) {
      const lob = await Lob.findOneAndUpdate(
        {
          categoryName: row.lob.categoryName,
        },
        {
          $setOnInsert: {
            categoryName: row.lob.categoryName,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      lobId = lob._id;
      lobCache.set(lobKey, lobId);
    }

    // ---------------- CARRIER ----------------
    const carrierKey = row.carrier.companyName;

    let carrierId = carrierCache.get(carrierKey);

    if (!carrierId) {
      const carrier = await Carrier.findOneAndUpdate(
        {
          companyName: row.carrier.companyName,
        },
        {
          $setOnInsert: {
            companyName: row.carrier.companyName,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      carrierId = carrier._id;
      carrierCache.set(carrierKey, carrierId);
    }

    // ---------------- POLICY ----------------
    policyDocuments.push({
      updateOne: {
        filter: {
          policyNumber: row.policy.policyNumber,
        },
        update: {
          $set: {
            ...row.policy,
            agentId,
            userId,
            accountId,
            lobId,
            carrierId,
          },
        },
        upsert: true,
      },
    });
  }

  let policyResult = {
    upsertedCount: 0,
    modifiedCount: 0,
  };

  if (policyDocuments.length > 0) {
    policyResult = await Policy.bulkWrite(policyDocuments, {
      ordered: false,
    });
  }

  return {
    totalRows: rows.length,
    insertedOrUpdatedPolicies:
      policyResult.upsertedCount + policyResult.modifiedCount,
  };
};

module.exports = {
  importPolicies,
};