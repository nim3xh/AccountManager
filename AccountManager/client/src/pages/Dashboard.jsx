import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./Dashboard.css";
import { Container } from "react-bootstrap"; // Import these components
import "bootstrap/dist/css/bootstrap.min.css";
import { CSVLink } from "react-csv";
import { debounce } from "lodash";

const BaseURL = import.meta.env.VITE_BASE_URL;

const generateRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const getLuminance = (hex) => {
  const rgb = parseInt(hex.substring(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance;
};

const assignColorsToAccounts = (data) => {
  const accountColors = {};
  data.forEach((item) => {
    const accountName = item.name;
    if (!accountColors[accountName]) {
      accountColors[accountName] = generateRandomColor();
    }
  });
  return accountColors;
};

function Dashboard() {
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountFilter, setAccountFilter] = useState("");
  const [csvFiles, setCsvFiles] = useState([]);
  const [accountColors, setAccountColors] = useState({});
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [isPAaccount, setIsPAaccount] = useState(false);
  const [isEvalAccount, setIsEvalAccount] = useState(false);
  const [selectedProcessRange, setSelectedProcessRange] = useState("");
  const [paAccountsCount, setPaAccountsCount] = useState(0);
  const [nonPaAccountsCount, setNonPaAccountsCount] = useState(0);
  const [setsData, setSetsData] = useState([]);

  const processRanges = [
    { label: "47000", min: 46750, max: 47249 },
    { label: "47500", min: 47250, max: 47749 },
    { label: "48000", min: 47750, max: 48249 },
    { label: "48500", min: 48250, max: 48749 },
    { label: "49000", min: 48750, max: 49249 },
    { label: "49500", min: 49250, max: 49749 },
    { label: "50000", min: 49750, max: 50249 },
    { label: "50500", min: 50500, max: 50749 },
    { label: "51000", min: 50750, max: 51249 },
    { label: "51500", min: 51250, max: 51749 },
    { label: "52000", min: 51750, max: 52249 },
    { label: "52500", min: 52250, max: 52749 },
    { label: "53000", min: 52750, max: 53249 },
    { label: "53500", min: 53250, max: 53749 },
    { label: "54000", min: 53750, max: 54249 },
    { label: "54500", min: 54250, max: 54749 },
    { label: "55000", min: 54750, max: 55249 },
  ];

  const deleteAllAccounts = async () => {
    if (
      window.confirm("Are you sure you want to delete all account details?")
    ) {
      try {
        const token = localStorage.getItem("access"); // Get the token from localStorage

        const headers = {
          Authorization: `Bearer ${token}`, // Pass token in the Authorization header
        };

        await axios.delete(`${BaseURL}accountDetails/`, { headers }); // Send headers with the delete request
        alert("All account details deleted successfully.");
        setCombinedData([]); // Clear the data in the frontend after deletion
        setFilteredData([]); // Clear the filtered data as well
      } catch (error) {
        console.error("Error deleting all accounts:", error);
        alert("Failed to delete all accounts.");
      }
    }
  };

  const clearSets = () => {
    setSetsData([]); // Reset the sets data to an empty array
  };

  const makeSets = () => {
    const groupedAccounts = {};

    // Group accounts by user name
    filteredData.forEach((account) => {
      if (!groupedAccounts[account.name]) {
        groupedAccounts[account.name] = [];
      }
      groupedAccounts[account.name].push(account);
    });

    const sets = [];
    const numRowsPerAccount = 4; // Number of rows per account

    // Get the maximum number of accounts for a user
    const maxGroupSize = Math.max(
      ...Object.values(groupedAccounts).map((group) => group.length)
    );

    // Create sets by appending each user's accounts in the desired order
    for (let i = 0; i < maxGroupSize; i++) {
      Object.keys(groupedAccounts).forEach((user) => {
        const userAccounts = groupedAccounts[user];
        // Add the specified number of rows for each account if available
        for (let j = 0; j < numRowsPerAccount; j++) {
          const accountIndex = i * numRowsPerAccount + j;
          if (userAccounts[accountIndex]) {
            sets.push(userAccounts[accountIndex]);
          }
        }
      });
    }

    setSetsData(sets);
  };

  const mergeData = (users, accountDetails) => {
    return accountDetails.map((account) => {
      const user = users.find((u) => u.accountNumber === account.accountNumber);
      return {
        ...account,
        name: user ? user.name : "Unknown",
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access"); // Get token from localStorage

        const headers = {
          Authorization: `Bearer ${token}`, // Add token to request headers
        };

        const [usersResponse, accountDetailsResponse] = await Promise.all([
          axios.get(`${BaseURL}users`, { headers }), // Pass headers with the token
          axios.get(`${BaseURL}accountDetails`, { headers }), // Pass headers with the token
        ]);

        const mergedData = mergeData(
          usersResponse.data,
          accountDetailsResponse.data
        );
        setCombinedData(mergedData);
        setFilteredData(mergedData);

        setAccountColors(assignColorsToAccounts(mergedData));
        setLoading(false);

        // Count PA and non-PA accounts in one pass
        let paCount = 0;
        let nonPaCount = 0;
        mergedData.forEach((item) => {
          if (item.account.startsWith("PA")) {
            paCount++;
          } else {
            nonPaCount++;
          }
        });
        setPaAccountsCount(paCount);
        setNonPaAccountsCount(nonPaCount);
      } catch (err) {
        setError("Something went wrong while fetching data.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const debouncedApplyFilters = useCallback(
    debounce(
      () => {
        const filteredCombinedData = applyFilters(
          combinedData,
          accountFilter,
          isAdminOnly,
          isPAaccount,
          isEvalAccount,
          selectedProcessRange,
          processRanges
        );
        setFilteredData(filteredCombinedData);

        const filteredSetsData = applyFilters(
          setsData,
          accountFilter,
          isAdminOnly,
          isPAaccount,
          isEvalAccount,
          selectedProcessRange,
          processRanges
        );
        setSetsData(filteredSetsData);
      },
      300 // 300ms delay
    ),
    [
      accountFilter,
      selectedProcessRange,
      combinedData,
      isAdminOnly,
      isPAaccount,
      isEvalAccount,
      setsData,
    ]
  );

  // Helper function to apply filters
  const applyFilters = (
    data,
    accountFilter,
    isAdminOnly,
    isPAaccount,
    isEvalAccount,
    selectedProcessRange,
    processRanges
  ) => {
    let filtered = data;

    // Apply account filter
    if (accountFilter) {
      filtered = filtered.filter(
        (item) => `${item.accountNumber} (${item.name})` === accountFilter
      );
    }

    // Filter for admin status
    if (isAdminOnly) {
      filtered = filtered.filter((item) => item.status === "admin only");
    } else {
      filtered = filtered.filter((item) => item.status !== "admin only");
    }

    // Filter accounts that start with "PA"
    if (isPAaccount) {
      filtered = filtered.filter((item) => item.account.startsWith("PA"));
    }

    // Filter accounts that start with "APEX"
    if (isEvalAccount) {
      filtered = filtered.filter((item) => item.account.startsWith("APEX"));
    }

    // Filter by selected process range
    if (selectedProcessRange) {
      const selectedRange = processRanges.find(
        (range) => range.label === selectedProcessRange
      );
      filtered = filtered.filter(
        (item) =>
          item.accountBalance >= selectedRange.min &&
          item.accountBalance <= selectedRange.max
      );
    }

    return filtered;
  };

  useEffect(() => {
    debouncedApplyFilters();
    return debouncedApplyFilters.cancel; // Cleanup debounce on unmount
  }, [debouncedApplyFilters]);

  const handleFileChange = (e) => {
    setCsvFiles(e.target.files);
  };

  const uploadCsvs = async () => {
    const formData = new FormData();
    for (const file of csvFiles) {
      formData.append("csvFiles", file);
    }

    try {
      const token = localStorage.getItem("access"); // Get the token from localStorage

      await Promise.all([
        axios.post(`${BaseURL}accountDetails/add-accounts`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`, // Add token in headers for authentication
          },
        }),
        axios.post(`${BaseURL}users/add-users`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`, // Add token in headers for authentication
          },
        }),
      ]);

      alert("CSV uploaded successfully!");

      // Refetch data after uploading CSVs
      fetchData();
      setCsvFiles([]); // Clear selected files after upload
    } catch (error) {
      console.error("Error uploading CSVs:", error);
      alert("Failed to upload CSV files.", error);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access"); // Get the token from localStorage

      const headers = {
        Authorization: `Bearer ${token}`, // Add token in the Authorization header
      };

      const [usersResponse, accountDetailsResponse] = await Promise.all([
        axios.get(`${BaseURL}users`, { headers }), // Pass headers with the token
        axios.get(`${BaseURL}accountDetails`, { headers }), // Pass headers with the token
      ]);

      const mergedData = mergeData(
        usersResponse.data,
        accountDetailsResponse.data
      );
      setCombinedData(mergedData);
      setFilteredData(mergedData);

      setAccountColors(assignColorsToAccounts(mergedData));
      setLoading(false);

      // Count PA and non-PA accounts
      const paCount = mergedData.filter((item) =>
        item.account.startsWith("PA")
      ).length;
      const nonPaCount = mergedData.length - paCount;

      setPaAccountsCount(paCount);
      setNonPaAccountsCount(nonPaCount);
    } catch (err) {
      setError("Something went wrong while fetching data.");
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  const encounteredAccounts = new Set();

  const uniqueAccountNumbers = combinedData
    .map((item) => {
      // Match and extract the account number pattern APEX-245360
      const match = item.accountNumber.match(/^(APEX-\d+)/);
      if (match) {
        const accountNumber = match[1];
        if (!encounteredAccounts.has(accountNumber)) {
          encounteredAccounts.add(accountNumber);
          return `${accountNumber} (${item.name})`;
        }
      }
      return null; // Skip if already encountered or no match
    })
    .filter(Boolean); // Filter out null values

  // Calculate total number of accounts and rows
  const totalAccounts = uniqueAccountNumbers.length;
  const totalRows = filteredData.length;

  // Calculate unique accounts from filteredData
  const uniqueAccountsInFilteredData = new Set(
    filteredData.map((item) => `${item.accountNumber} (${item.name})`)
  );
  const totalUniqueAccountsDisplayed = uniqueAccountsInFilteredData.size;

  const generateCsvFilename = () => {
    let fileName = selectedProcessRange ? selectedProcessRange + "-all" : "all";

    // Include filters in the filename
    if (accountFilter) {
      const accountName = accountFilter.split(" ");
      fileName += `-${accountName}`;
    }

    if (isAdminOnly) {
      fileName += `-admin`;
    }
    if (isPAaccount) {
      fileName += `-PA`;
    }
    if (isEvalAccount) {
      fileName += `-eval`;
    }

    return `${fileName}.csv`;
  };

  const exportCsv = () => {
    // Choose between filteredData or setsData
    const dataToExport = setsData.length > 0 ? setsData : filteredData;

    const csvData = dataToExport.map((account) => ({
      Account: account.account,
      AccountBalance: account.accountBalance,
      AccountName: `${account.accountNumber} (${account.name})`,
      Status: account.status,
      TrailingThreshold: account.trailingThreshold,
      PnL: account.PnL,
    }));

    const headers = [
      { label: "Account", key: "Account" },
      { label: "Account Balance", key: "AccountBalance" },
      { label: "Account Name", key: "AccountName" },
      { label: "Status", key: "Status" },
      { label: "Trailing Threshold", key: "TrailingThreshold" },
      { label: "PnL", key: "PnL" },
    ];

    return { data: csvData, headers, filename: generateCsvFilename() };
  };

  return (
    <>
      <div></div>
      {/* Summary Section */}
      <div
        id="summary"
        className="summary-container"
        style={{
          marginTop: "30px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Summary Boxes */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div className="summary-box">
            <h4>Total Rows Displayed: {totalRows}</h4>
          </div>
          <div className="summary-box">
            <h4>
              Total Unique Accounts Displayed: {totalUniqueAccountsDisplayed}
            </h4>
          </div>
          <div className="summary-box">
            <h4>Total PA Account Rows: {paAccountsCount}</h4>
          </div>
          <div className="summary-box">
            <h4>Total Eval Account Rows: {nonPaAccountsCount}</h4>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <button
            onClick={deleteAllAccounts}
            style={{
              backgroundColor: "red",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Clear all
          </button>

          {/* Checkboxes */}
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <label>
              <input
                type="checkbox"
                checked={isAdminOnly}
                onChange={(e) => setIsAdminOnly(e.target.checked)}
                style={{ marginRight: "5px" }}
              />
              Show Admin Only
            </label>

            <label>
              <input
                type="checkbox"
                checked={isPAaccount}
                onChange={(e) => setIsPAaccount(e.target.checked)}
                style={{ marginRight: "5px" }}
              />
              Show PA Accounts Only
            </label>

            <label>
              <input
                type="checkbox"
                checked={isEvalAccount}
                onChange={(e) => setIsEvalAccount(e.target.checked)}
                style={{ marginRight: "5px" }}
              />
              Show Eval Accounts Only
            </label>
          </div>
        </div>

        {/* Filter and Export Section */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <div>
            <label htmlFor="accountFilter">Filter by Account: </label>
            <select
              id="accountFilter"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              style={{ marginRight: "10px" }}
            >
              <option value="">All</option>
              {uniqueAccountNumbers.map((account) => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="processCsv">Process CSV: </label>
            <select
              id="processCsv"
              value={selectedProcessRange}
              onChange={(e) => setSelectedProcessRange(e.target.value)}
              style={{ marginLeft: "10px" }}
            >
              <option value="">Select Range</option>
              {processRanges.map((range) => (
                <option key={range.label} value={range.label}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <CSVLink
            {...exportCsv()}
            className="btn"
            style={{
              backgroundColor: "green",
              color: "white",
              textDecoration: "none",
              padding: "10px 15px",
              borderRadius: "5px",
            }}
          >
            Export CSV
          </CSVLink>
        </div>

        {/* File Upload and Set Control */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* File Upload Section */}
          <div
            className="file-upload-container"
            style={{ display: "flex", alignItems: "center" }}
          >
            <input
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileChange}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={uploadCsvs}
              style={{
                marginLeft: "15px",
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Fetch CSVs
            </button>
          </div>

          {/* Set Control Section */}
          <div
            className="set-control-container"
            style={{ display: "flex", gap: "15px", alignItems: "center" }}
          >
            <button
              onClick={makeSets}
              disabled={!!accountFilter}
              style={{
                padding: "8px 16px",
                color: "white",
                border: "none",
                borderRadius: "4px",
                backgroundColor: "#007bff",
                cursor: "pointer",
              }}
            >
              Make Sets
            </button>
            <button
              onClick={clearSets}
              disabled={!!accountFilter}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ff5722",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Clear Sets
            </button>
          </div>
        </div>
      </div>
      <div className="App">
        <table border="1">
          <thead>
            <tr>
              <th>Account</th>
              <th>Account Balance</th>
              <th>Account Name</th>
              <th>Status</th>
              <th>Trailing Threshold</th>
              <th>PnL</th>
            </tr>
          </thead>
          <tbody>
            {setsData.length > 0
              ? setsData.map((account) => {
                  const backgroundColor = accountColors[account.name];
                  const luminance = getLuminance(backgroundColor);
                  const textColor = luminance > 160 ? "#000000" : "#FFFFFF";

                  return (
                    <tr
                      key={account.id}
                      style={{
                        backgroundColor,
                        color: textColor,
                      }}
                    >
                      <td>{account.account}</td>
                      <td>{account.accountBalance}</td>
                      <td>
                        {account.accountNumber} ({account.name})
                      </td>
                      <td>{account.status}</td>
                      <td>{account.trailingThreshold}</td>
                      <td>{account.PnL}</td>
                    </tr>
                  );
                })
              : filteredData.map((account) => {
                  const backgroundColor = accountColors[account.name];
                  const luminance = getLuminance(backgroundColor);
                  const textColor = luminance > 160 ? "#000000" : "#FFFFFF";

                  return (
                    <tr
                      key={account.id}
                      style={{
                        backgroundColor,
                        color: textColor,
                      }}
                    >
                      <td>{account.account}</td>
                      <td>{account.accountBalance}</td>
                      <td>
                        {account.accountNumber} ({account.name})
                      </td>
                      <td>{account.status}</td>
                      <td>{account.trailingThreshold}</td>
                      <td>{account.PnL}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Dashboard;
