import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { HiHome } from "react-icons/hi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Spinner,
  Tooltip,
  Breadcrumb,
} from "flowbite-react";
import { MdAccountBalance, MdPerson, MdTableRows } from "react-icons/md";
import { CiMemoPad } from "react-icons/ci";
import axios from "axios";
import { Datepicker } from "flowbite-react";
import useRealTimeDate from '../../hooks/useRealTimeDate';


const BaseURL = import.meta.env.VITE_BASE_URL;

export default function DashboardCompUser() {
  const { currentUser } = useSelector((state) => state.user);
  const [combinedData, setCombinedData] = useState([]);
  const [combinedDeletedData, setCombinedDeletedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [todayDate, setTodayDate] = useState(new Date());
  const [deletedpaStats, setDeletedpaStats] = useState({
    PA1: 0,
    PA2: 0,
    PA3: 0,
    PA4: 0,
    paCount: 0, // PA Count > 53,000
    poCount: 0, // PO Count > 53,000
    adminOnly: 0, // Admin Only
  });

  const [paStats, setPaStats] = useState({
    PA1: 0,
    PA2: 0,
    PA3: 0,
    PA4: 0,
    paCount: 0, // PA Count > 53,000
    poCount: 0, // PO Count > 53,000
    adminOnly: 0, // Admin Only
  });
  const [createdDateTime, setCreatedDateTime] = useState("");

  const formattedTodayDate = useRealTimeDate();

  // Function to merge users and account details data
  const mergeData = (users, accountDetails) => {
    return accountDetails.map((account) => {
      const user = users.find((u) => u.accountNumber === account.accountNumber);
      return {
        ...account,
        name: user ? user.name : "Unknown",
      };
    });
  };

  const fetchData = async () => {
  try {
    const token = currentUser.token;
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [usersResponse, accountDetailsResponse] = await Promise.all([
      axios.get(`${BaseURL}users`, { headers }),
      axios.get(`${BaseURL}accountDetails/account/APEX-${currentUser.user.ApexAccountNumber}`, { headers }),
    ]);

    const mergedData = mergeData(
      usersResponse.data,
      accountDetailsResponse.data
    );

    setCombinedData(mergedData);

    // Set createdDateTime for the first item if available
    if (mergedData.length > 0) {
      setCreatedDateTime(mergedData[0].createdAt);
    } else {
      setCreatedDateTime(null);
    }

    // Initialize statistics
    const paStats = {
      PA1: 0,
      PA2: 0,
      PA3: 0,
      PA4: 0,
      paCount: 0, // PA Count > 53,000
      poCount: 0, // PO Count > 53,000
      adminOnly: 0, // Admin Only
    };

    // Categorize and count accounts
    mergedData.forEach((account) => {
      const balance = parseFloat(account.accountBalance);
      const isPA = account.account.startsWith("PA");
      const isEval = account.account.startsWith("APEX");
      const isAdmin = account.status === "admin only";
      const isActive = account.status === "active";

      // PA Account count > 53,000
      if (isEval && balance > 53000) {
        paStats.paCount++;
      }

      // PO Account count > 53,000
      if (isPA && balance > 53000) {
        paStats.poCount++;
      }

      // Admin Only Count
      if (isAdmin) {
        paStats.adminOnly++;
      }

      // Categorize PA account balance ranges
      if (isPA && isActive) {
        if ( balance > 53000 ) paStats.PA1++;
        else if ( balance > 56000) paStats.PA2++;
        else if ( balance > 59000) paStats.PA3++;
        else if ( balance > 62000) paStats.PA4++;
      }
    });

    setPaStats(paStats);
    setLoading(false);

    // Calculate statistics for each user
    const stats = {};
    let totalEvalActive = 0;
    let totalPAActive = 0;
    let totalEvalAdminOnly = 0;
    let totalPAAdminOnly = 0;

    mergedData.forEach((item) => {
      const userName = item.name + " (" + item.accountNumber.replace('APEX-', '') + ")";
      const isPA = item.account.startsWith("PA");
      const isActive = item.status === "active";
      const isEval = item.account.startsWith("APEX");
      const isAdmin = item.status === "admin only";

      // Initialize user stats if not already done
      if (!stats[userName]) {
        stats[userName] = {
          evalActive: 0,
          paActive: 0,
          evalAdminOnly: 0,
          paAdminOnly: 0,
        };
      }

      // Increment counts based on conditions
      if (isEval && isActive) {
        stats[userName].evalActive++;
        totalEvalActive++;
      }
      if (isPA && isActive) {
        stats[userName].paActive++;
        totalPAActive++;
      }
      if (isAdmin && isEval) {
        stats[userName].evalAdminOnly++;
        totalEvalAdminOnly++;
      }
      if (isAdmin && isPA) {
        stats[userName].paAdminOnly++;
        totalPAAdminOnly++;
      }
    });

    // Transform stats into an array for rendering
    const userStatsArray = Object.keys(stats).map((userName) => ({
      userName,
      ...stats[userName],
      totalAccounts: stats[userName].evalActive + stats[userName].paActive,
    }));

    setUserStats(userStatsArray);
  } catch (err) {
    console.error("Error fetching data:", err);
    setError("Something went wrong while fetching data.");
    setLoading(false);
  }
};

  const fetchDeletedData = async () => {
    setLoading(true);
    try {
      const token = currentUser.token;
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [usersResponse, accountDetailsResponse] = await Promise.all([
        axios.get(`${BaseURL}users`, { headers }),
        axios.get(`${BaseURL}accountDetails/viewDeleted/APEX-${currentUser.user.ApexAccountNumber}`, { headers }),
      ]);

      const mergedData = mergeData(
        usersResponse.data,
        accountDetailsResponse.data
      );
      
      setCombinedDeletedData(mergedData);

      // Initialize statistics
      const deletedpaStats = {
        PA1: 0,
        PA2: 0,
        PA3: 0,
        PA4: 0,
        paCount: 0, // PA Count > 53,000
        poCount: 0, // PO Count > 53,000
        adminOnly: 0, // Admin Only
      };

      // Categorize and count accounts
      mergedData.forEach((account) => {
        const balance = parseFloat(account.accountBalance);
        const isPA = account.account.startsWith("PA");
        const isEval = account.account.startsWith("APEX");
        const isAdmin = account.status === "admin only";
        const isActive = account.status === "active";

        // PA Account count > 53,000
        if (isEval && balance > 53000) {
          deletedpaStats.paCount++;
        }

        // PO Account count > 53,000
        if (isPA && balance > 53000) {
          deletedpaStats.poCount++;
        }

        // Admin Only Count
        if (isAdmin) {
          deletedpaStats.adminOnly++;
        }

        // Categorize PA account balance ranges
        if (isPA && isActive) {
          if (balance >= 47500 && balance <= 53200) deletedpaStats.PA1++;
          else if (balance >= 53201 && balance <= 55800) deletedpaStats.PA2++;
          else if (balance > 55800 && balance <= 58000) deletedpaStats.PA3++;
          else if (balance > 58000 && balance <= 60600) deletedpaStats.PA4++;
        }

      });

      setDeletedpaStats(deletedpaStats);
      setLoading(false);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Something went wrong while fetching data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDeletedData();
  }, [BaseURL, currentUser]);

  const formattedDateTime = createdDateTime
  ? new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'short', // Optional, for full weekday names like Mon, Tue
      year: 'numeric',
      month: 'short',  // Optional, short month names like Jan, Feb
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,  // Use 12-hour format with AM/PM
  }).format(new Date(createdDateTime))
  : '';

  // Calculate unique accounts from filteredData
  const uniqueAccountsInFilteredData = new Set(
    combinedData.map((item) => `${item.accountNumber} (${item.name})`)
    
  );
  const totalUniqueAccountsDisplayed = uniqueAccountsInFilteredData.size;

  return (
    <div className="p-3 w-full">
      <Breadcrumb aria-label="Default breadcrumb example">
        <Breadcrumb.Item href="#" icon={HiHome}>
          Home
        </Breadcrumb.Item>
      </Breadcrumb>
      <div className="text-2xl text-center mt-4">
        Welcome, {currentUser.user.FirstName} {currentUser.user.LastName}!
      </div>
      <p className="text-lg font-semibold text-gray-600 dark:text-white">{formattedTodayDate}</p> 
      {currentUser.user.role === "user" && (
        <>
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Spinner size="xl" />
            </div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <>
              <div className="flex-wrap flex gap-4 justify-center mt-4">
                    {/* <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-40 w-full rounded-md shadow-md">
                      <div className="flex justify-between">
                        <div className="">
                          <h3 className="text-gray-500 text-md uppercase">
                            Users{" "}
                          </h3>
                          <p className="text-2xl">{totalUniqueAccountsDisplayed}</p>
                        </div>
                      </div>
                    </div> */}

                    <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-40 w-full rounded-md shadow-md">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-gray-500 text-md uppercase">
                            EVAL
                          </h3>
                          <p className="text-2xl">
                            {userStats.reduce(
                              (acc, user) => acc + user.evalActive,
                              0
                            )}
                          </p>
                        </div>
                        {/* <MdTableRows className="bg-teal-600 text-white rounded-full text-5xl p-3 shadow-lg" /> */}
                      </div>
                    </div>
                    <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-40 w-full rounded-md shadow-md">
                      <div className="flex justify-between">
                        <div>
                        <h3 className="text-gray-500 text-md uppercase">
                            PA
                          </h3>
                          <p className="text-2xl">
                          {userStats.reduce(
                            (acc, user) => acc + user.paActive,
                            0
                          )}
                          </p>
                        </div>                    
                      </div>
                    </div>

                    <Tooltip content="Balance > $53,000">
                      <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-40 w-full rounded-md shadow-md">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-gray-500 text-md uppercase">
                              PO1
                            </h3>
                            <p className="text-2xl">
                              {paStats.PA1}
                            </p>
                          </div>
                          {/* <MdAccountBalance className="bg-teal-600 text-white rounded-full text-5xl p-3 shadow-lg" /> */}
                        </div>
                      </div>
                    </Tooltip>
                    <Tooltip content="Balance > $56,000">
                      <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-40 w-full rounded-md shadow-md">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-gray-500 text-md uppercase">
                              PO2
                            </h3>
                            <p className="text-2xl">
                              {paStats.PA2}
                            </p>
                          </div>
                          {/* <MdAccountBalance className="bg-teal-600 text-white rounded-full text-5xl p-3 shadow-lg" /> */}
                        </div>
                      </div>
                    </Tooltip>
                    
                    <Tooltip content="Balance > $59,000">
                      <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-40 w-full rounded-md shadow-md" >
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-gray-500 text-md uppercase">
                              PO3
                            </h3>
                            <p className="text-2xl">
                              {paStats.PA3}
                            </p>
                          </div>
                          {/* <MdAccountBalance className="bg-teal-600 text-white rounded-full text-5xl p-3 shadow-lg" /> */}
                        </div>
                      </div>
                    </Tooltip>
                      
                    <Tooltip content="Balance > $62,000">
                      <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-40 w-full rounded-md shadow-md">
                        <div className="flex justify-between">
                          <div title="Balance Range: 58,001 - 60,600">
                            <h3 className="text-gray-500 text-md uppercase">
                              PO4
                            </h3>
                            <p className="text-2xl">
                              {paStats.PA4}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Tooltip>
                    


                    {/* <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-60 w-full rounded-md shadow-md">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-gray-500 text-md uppercase">
                            Admin Only
                          </h3>
                          <p className="text-2xl">
                            {userStats.reduce(
                              (acc, user) => acc + user.evalAdminOnly+user.paAdminOnly,
                              0
                            )}
                          </p>
                        </div>
                        <CiMemoPad className="bg-teal-600 text-white rounded-full text-5xl p-3 shadow-lg" />
                      </div>
                    </div> */}
                  </div>

                  <div className="flex flex-col md:flex-row justify-center items-center md:space-x-4">
                      {/* Table Section */}
                      <div>
                        <Table hoverable className="shadow-md w-full mt-5">
                          <TableHead>
                            <TableHeadCell></TableHeadCell>
                            <TableHeadCell>PA Count</TableHeadCell>
                            <TableHeadCell>PO Count</TableHeadCell>
                            <TableHeadCell>Admin Only</TableHeadCell>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <div>
                                  <p><b>Today's:</b></p>
                                  <p><b>Till Date:</b></p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p>{paStats.paCount}</p>
                                  <p>{deletedpaStats.paCount}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p>{paStats.poCount}</p>
                                  <p>{deletedpaStats.poCount}</p> 
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p>{paStats.adminOnly}</p>
                                  <p>{deletedpaStats.adminOnly}</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>



                  <div className="flex flex-col md:flex-row justify-center items-center md:space-x-4">
                    {/* Table Section */}
                    <div>
                    {/* <div className="w-full flex justify-between items-center mb-3 mt-5">
                      <p className="text-left text-sm md:text-base text-gray-700 dark:text-white">
                        Last Updated: 
                        <span className="font-medium text-gray-600 dark:text-white">
                          {formattedDateTime ? `(${formattedDateTime})` : 'N/A'}
                        </span>
                      </p>
                    </div> */}
                    <div className="table-wrapper overflow-x-auto max-h-[400px]">
                      <Table hoverable className="shadow-md w-full">
                        <TableHead>
                          <TableHeadCell className="sticky top-0 bg-white z-10">#</TableHeadCell>
                          <TableHeadCell className="sticky top-0 bg-white z-10">User ID</TableHeadCell>
                          <TableHeadCell className="sticky top-0 bg-white z-10">EVAL</TableHeadCell>
                          <TableHeadCell className="sticky top-0 bg-white z-10">PA</TableHeadCell>
                          <TableHeadCell className="sticky top-0 bg-white z-10">Admin Only</TableHeadCell>
                          <TableHeadCell className="sticky top-0 bg-white z-10"><b>Total</b></TableHeadCell>
                          {/* <TableHeadCell className="sticky top-0 bg-white z-10">EVAL to PA</TableHeadCell> */}
                          {/* <TableHeadCell className="sticky top-0 bg-white z-10">PO</TableHeadCell> */}
                        </TableHead>
                        <TableBody>
                          {userStats
                            .sort((a, b) => {
                              const numA = parseInt(a.userName.replace(/[^\d()]/g, '').match(/\d+/)?.[0] || 0, 10);
                              const numB = parseInt(b.userName.replace(/[^\d()]/g, '').match(/\d+/)?.[0] || 0, 10);
                              return numA - numB; // Sorting numerically
                            })
                            .map((user, index) => (
                              <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                  <Tooltip content={user.userName.replace(/\s*\(.*?\)/, '')}>
                                    <span>{user.userName.replace(/[^\d()]/g, '').match(/\d+/)?.[0]}</span>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>{user.evalActive}</TableCell>
                                <TableCell>{user.paActive}</TableCell>
                                <TableCell>{user.evalAdminOnly + user.paAdminOnly}</TableCell>
                                <TableCell><b>{user.totalAccounts}</b></TableCell>
                                {/* <TableCell>Pending</TableCell> */}
                                {/* <TableCell>Pending</TableCell> */}
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                      
                    </div>
                  </div>
            </>
          )}
        </>
      )}
    </div>
  );
}