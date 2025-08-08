import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { RestaurantMenu, History, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const EmployeeBottomNav = () => {
  const [value, setValue] = React.useState(0);
  const navigate = useNavigate();

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          switch (newValue) {
            case 0:
              navigate('/employee/menu');
              break;
            case 1:
              navigate('/employee/orders');
              break;
            case 2:
              navigate('/employee/profile');
              break;
            default:
              break;
          }
        }}
      >
        <BottomNavigationAction label="Menu" icon={<RestaurantMenu />} />
        <BottomNavigationAction label="Orders" icon={<History />} />
        <BottomNavigationAction label="Profile" icon={<Person />} />
      </BottomNavigation>
    </Paper>
  );
};

export default EmployeeBottomNav;