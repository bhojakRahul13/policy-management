const { parentPort, workerData } = require("worker_threads");
const XLSX = require("xlsx");

const REQUIRED_COLUMNS = [
  "agent",
  "userType",
  "policy_number",
  "company_name",
  "category_name",
  "policy_start_date",
  "policy_end_date",
  "account_name",
  "email",
  "firstname",
  "phone",
  "address",
  "state",
  "zip",
  "dob",
];

const cleanValue = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const stringValue = String(value).trim();

  return stringValue === "" ? null : stringValue;
};

const toNumber = (value) => {
  const cleaned = cleanValue(value);

  if (cleaned === null) {
    return null;
  }

  const number = Number(cleaned);

  return Number.isNaN(number) ? null : number;
};

const toDate = (value) => {
  const cleaned = cleanValue(value);

  if (!cleaned) {
    return null;
  }

  const date = new Date(cleaned);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const validateColumns = (headers) => {
  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !headers.includes(column)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Missing required columns: ${missingColumns.join(", ")}`
    );
  }
};

const transformRow = (row, rowNumber) => {
  const policyNumber = cleanValue(row.policy_number);

  if (!policyNumber) {
    throw new Error(`Missing policy_number at row ${rowNumber}`);
  }

  return {
    sourceRow: rowNumber,

    agent: {
      name: cleanValue(row.agent),
      agencyId: cleanValue(row.agency_id),
    },

    user: {
      firstName: cleanValue(row.firstname),
      userType: cleanValue(row.userType),
      email: cleanValue(row.email),
      gender: cleanValue(row.gender),
      city: cleanValue(row.city),
      phone: cleanValue(row.phone),
      address: cleanValue(row.address),
      state: cleanValue(row.state),
      zip: cleanValue(row.zip),
      dob: toDate(row.dob),
      primary: cleanValue(row.primary),
      applicantId: cleanValue(row["Applicant ID"]),
    },

    account: {
      accountName: cleanValue(row.account_name),
      accountType: cleanValue(row.account_type),
    },

    lob: {
      categoryName: cleanValue(row.category_name),
    },

    carrier: {
      companyName: cleanValue(row.company_name),
    },

    policy: {
      policyNumber,
      policyMode: toNumber(row.policy_mode),
      producer: cleanValue(row.producer),
      premiumAmountWritten: toNumber(row.premium_amount_written),
      premiumAmount: toNumber(row.premium_amount),
      policyType: cleanValue(row.policy_type),
      policyStartDate: toDate(row.policy_start_date),
      policyEndDate: toDate(row.policy_end_date),
      csr: cleanValue(row.csr),
    },
  };
};

try {
  const workbook = XLSX.readFile(workerData.filePath, {
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("No worksheet found in uploaded file");
  }

  const worksheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: false,
  });

  if (!rows.length) {
    throw new Error("Uploaded file contains no data");
  }

  const headers = Object.keys(rows[0]);

  validateColumns(headers);

  const transformedRows = rows.map((row, index) =>
    transformRow(row, index + 2)
  );

  parentPort.postMessage({
    success: true,
    totalRows: transformedRows.length,
    rows: transformedRows,
  });
} catch (error) {
  parentPort.postMessage({
    success: false,
    error: error.message,
  });
}