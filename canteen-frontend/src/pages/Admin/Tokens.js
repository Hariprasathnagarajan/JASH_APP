import { useState, useCallback, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { useApi } from '../../hooks/useApi';

const defaultTokenData = {
  day_shift: { users: [], total_tokens: 0 },
  mid_shift: { users: [], total_tokens: 0 },
  night_shift: { users: [], total_tokens: 0 }
};

const AdminTokens = () => {
  const [tokenData, setTokenData] = useState(defaultTokenData);
  const [assigning, setAssigning] = useState(false);

  // Use the enhanced useApi hook for token summary
  const { 
    loading, 
    error,
    callApi: fetchTokenSummary,
    data: apiData,
    cancel: cancelTokenFetch
  } = useApi({
    initialData: defaultTokenData,
    defaultErrorMessage: 'Failed to load token summary',
    logRequests: true,
    skipIfLoading: true // Prevent duplicate requests
  });
  
  // Use the useApi hook for token assignment
  const { callApi: fetchAssignTokens } = useApi({
    defaultErrorMessage: 'Failed to assign tokens',
    logRequests: true,
    skipIfLoading: true // Prevent duplicate requests
  });

  // Process API data when it changes
  useEffect(() => {
    if (!apiData) return;
    
    console.log('[Tokens] Processing token data:', apiData);
    
    // Ensure we have the expected structure
    const processedData = {
      day_shift: {
        users: Array.isArray(apiData.day_shift?.users) ? apiData.day_shift.users : [],
        total_tokens: apiData.day_shift?.total_tokens || 0
      },
      mid_shift: {
        users: Array.isArray(apiData.mid_shift?.users) ? apiData.mid_shift.users : [],
        total_tokens: apiData.mid_shift?.total_tokens || 0
      },
      night_shift: {
        users: Array.isArray(apiData.night_shift?.users) ? apiData.night_shift.users : [],
        total_tokens: apiData.night_shift?.total_tokens || 0
      }
    };
    
    console.log('Processed token data:', processedData);
    setTokenData(processedData);
  }, [apiData]);

  // Initial load and error handling
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadData = async () => {
      if (!isMounted || !isMounted.current) return;
      
      try {
        console.log(`[Tokens] Fetching token summary (attempt ${retryCount + 1}/${maxRetries + 1})...`);
        const result = await fetchTokenSummary(adminAPI.getTokenSummary);
        
        if (!isMounted || !isMounted.current) return;
        
        // Handle aborted requests
        if (result?.aborted) {
          console.log('[Tokens] Token summary request was aborted');
          return;
        }
        
        // Handle errors
        if (result?.error) {
          console.error('[Tokens] Error in token summary:', result.error);
          throw new Error(result.error.message || 'Failed to load token summary');
        }
        
        console.log('[Tokens] Token data loaded successfully');
        
      } catch (error) {
        console.error('[Tokens] Error loading token summary:', error);
        
        // Retry logic with exponential backoff
        if (retryCount < maxRetries && isMounted && isMounted.current) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10s delay
          console.log(`[Tokens] Retrying in ${delay}ms (attempt ${retryCount + 1})...`);
          
          const timeoutId = setTimeout(() => {
            loadData();
          }, delay);
          
          return () => clearTimeout(timeoutId);
        }
        
        // Only show error if we've exhausted all retries
        if (isMounted && isMounted.current) {
          toast.error(error.message || 'Failed to load token data');
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
      cancelTokenFetch();
    };
  }, [cancelTokenFetch, fetchTokenSummary]);


  const handleAssignTokens = async (shift) => {
    if (assigning) {
      console.log(`[Tokens] Token assignment already in progress for ${shift} shift`);
      toast.info('Token assignment already in progress');
      return;
    }
    
    // Check if we're within the first 3 days of the month
    const today = new Date();
    const isFirstThreeDays = today.getDate() <= 3;
    
    if (!isFirstThreeDays && !window.confirm(
      `Warning: It's not the first 3 days of the month. ` +
      `Tokens can only be assigned within the first 3 days.\n\n` +
      `Do you still want to try to assign tokens for ${shift} shift?`
    )) {
      return;
    }
    
    console.log(`[Tokens] Starting token assignment for ${shift} shift`);
    setAssigning(true);
    
    try {
      const result = await fetchAssignTokens(() => adminAPI.assignTokens(shift));
      
      if (result?.aborted) {
        console.log(`[Tokens] Token assignment for ${shift} was aborted (stale request)`);
        return;
      }
      
      if (result?.error) {
        throw result.error;
      }
      
      console.log(`[Tokens] Successfully assigned tokens for ${shift} shift`, result);
      toast.success(`Tokens assigned successfully for ${shift} shift`);
      
      // Refresh the token summary after assignment
      fetchTokenSummary(adminAPI.getTokenSummary);
    } catch (error) {
      // Don't show error toast for stale requests
      if (error === 'Stale request' || error?.message === 'Stale request') {
        console.log(`[Tokens] Ignoring stale request for ${shift} shift`);
        return;
      }
      
      // Extract error message from different possible locations
      const errorMessage = error?.response?.data?.error || 
                         error?.response?.data?.message || 
                         error?.data?.error ||
                         error?.message || 
                         'Failed to assign tokens';
      
      console.error(`[Tokens] Error assigning tokens to ${shift} shift:`, {
        message: errorMessage,
        error: error?.response?.data || error,
        status: error?.response?.status
      });
      
      toast.error(errorMessage);
      
    } finally {
      setAssigning(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      case 'guest': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderShiftSection = (shift, title) => (
    <div key={shift} className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {title} Shift
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            {tokenData[shift]?.users?.length || 0} Users
          </span>
        </h2>
        <button
          onClick={() => handleAssignTokens(shift)}
          disabled={assigning}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
            assigning ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {assigning ? 'Assigning...' : 'Assign Tokens'}
        </button>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {tokenData[shift].users.map((user) => {
            const roleColor = getRoleBadgeColor(user.role);
            return (
              <li key={user.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleColor}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {user.tokens} Tokens
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {tokenData[shift].users.length === 0 && (
          <div className="px-4 py-5 text-center text-gray-500 text-sm">
            No users found in this shift
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading token data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Token Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage monthly token allocations for all users
          </p>
        </div>
        
        <div className="space-y-8">
          {renderShiftSection('day_shift', 'Day')}
          {renderShiftSection('mid_shift', 'Mid')}
          {renderShiftSection('night_shift', 'Night')}
        </div>
      </div>
    </div>
  );
};

export default AdminTokens;