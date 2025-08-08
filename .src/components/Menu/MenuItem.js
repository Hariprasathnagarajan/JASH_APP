import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';

const MenuItem = ({ item, onAdd, onRemove, inCart }) => {
  return (
    <Card>
      <CardMedia
        component="img"
        height="140"
        image={item.image || '/placeholder-food.jpg'}
        alt={item.name}
      />
      <CardContent>
        <Typography gutterBottom variant="h6" component="div">
          {item.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {item.description}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Price: {item.price} tokens
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          {inCart ? (
            <Button 
              variant="contained" 
              color="error"
              onClick={() => onRemove(item.id)}
            >
              Remove
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={() => onAdd(item)}
              disabled={!item.is_available}
            >
              {item.is_available ? 'Add to Cart' : 'Unavailable'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MenuItem;