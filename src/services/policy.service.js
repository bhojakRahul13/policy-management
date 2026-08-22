const User = require("../models/User");
const Policy = require("../models/Policy");

const searchPoliciesByUsername = async (username) => {
  const user = await User.findOne({
    firstName: {
      $regex: username.trim(),
      $options: "i",
    },
  });

  if (!user) {
    return null;
  }

  const policies = await Policy.find({
    userId: user._id,
  })
    .populate("agentId", "name agencyId")
    .populate("accountId", "accountName accountType")
    .populate("lobId", "categoryName")
    .populate("carrierId", "companyName")
    .lean();

  return {
    user: {
      id: user._id,
      firstName: user.firstName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zip: user.zip,
      dob: user.dob,
      userType: user.userType,
    },
    policies,
  };
};

const getPoliciesByUsers = async () => {
  return Policy.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "agents",
        localField: "agentId",
        foreignField: "_id",
        as: "agent",
      },
    },
    {
      $unwind: {
        path: "$agent",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "account",
      },
    },
    {
      $unwind: {
        path: "$account",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "lobs",
        localField: "lobId",
        foreignField: "_id",
        as: "lob",
      },
    },
    {
      $unwind: {
        path: "$lob",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "carriers",
        localField: "carrierId",
        foreignField: "_id",
        as: "carrier",
      },
    },
    {
      $unwind: {
        path: "$carrier",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$userId",

        user: {
          $first: {
            id: "$user._id",
            firstName: "$user.firstName",
            email: "$user.email",
            phone: "$user.phone",
          },
        },

        totalPolicies: {
          $sum: 1,
        },

        policies: {
          $push: {
            policyNumber: "$policyNumber",
            policyType: "$policyType",
            premiumAmount: "$premiumAmount",
            policyStartDate: "$policyStartDate",
            policyEndDate: "$policyEndDate",

            agent: "$agent.name",
            account: "$account.accountName",
            category: "$lob.categoryName",
            carrier: "$carrier.companyName",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        user: 1,
        totalPolicies: 1,
        policies: 1,
      },
    },
    {
      $sort: {
        "user.firstName": 1,
      },
    },
  ]);
};

module.exports = {
  searchPoliciesByUsername,
  getPoliciesByUsers,
};
