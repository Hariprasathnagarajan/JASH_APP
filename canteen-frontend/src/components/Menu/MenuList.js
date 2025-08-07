import React from 'react';
import { Grid } from '@mui/material';
import MenuItem from './MenuItem';

const MenuList = ({ items, editable, onEdit, onDelete }) => {
  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item.id}>
          <MenuItem 
            item={item} 
            editable={editable}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default MenuList;