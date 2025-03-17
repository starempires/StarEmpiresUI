import React, { createContext, useState } from 'react';

const OrdersContext = createContext();

const OrdersProvider = ({ children }) => {
// orders are optimized for UI. They're expected to be reformatted as needed for submission
  const [loadOrders, setLoadOrders] = useState(new Map());
  const [unloadOrders, setUnloadOrders] = useState(new Map());
  const [fireOrders, setFireOrders] = useState(new Map());

  const addLoadOrder = (cargo, carrier) => {
      const carrierLoads = loadOrders.get(carrier) || [];
      carrierLoads.push(cargo);
      const newLoadOrders = new Map(loadOrders.set(carrier, carrierLoads));
      setLoadOrders(newLoadOrders);
      console.log("add order: load " + cargo.name + " onto " + carrier.name);
  };

  const deleteLoadOrder = (cargo, carrier) => {
     let pendingLoads = loadOrders.get(carrier) || [];
     pendingLoads = pendingLoads.filter(ship => ship !== cargo);
     setLoadOrders(new Map(loadOrders.set(carrier, pendingLoads)));
      console.log("delete order: load " + cargo.name + " onto " + carrier.name);
  };

  const addUnloadOrder = (cargo, carrier) => {
      const pendingLoads = loadOrders.get(carrier) || [];
      const pendingUnloads = unloadOrders.get(carrier) || [];

      if (pendingLoads.includes(cargo)) {
          // pending load order for this cargo exists -- just delete load order
          deleteLoadOrder(carrier, cargo);
      }
      else {
          // unload must be for original cargo -- add unload order
          if (!pendingUnloads.includes(cargo)) {
              pendingUnloads.push(cargo);
          }
          setUnloadOrders(new Map(unloadOrders.set(carrier, pendingUnloads)));
          console.log("adding order: unload " + cargo.name + " from " + carrier.name);
      }
  };

  const hasLoadOrder = (ship) => {
     for (let cargoList of loadOrders.values()) {
        if (cargoList.includes(ship)) {
            return true;
        }
     }
     return false;
  };

  const hasUnloadOrder = (ship) => {
     for (let cargoList of unloadOrders.values()) {
        if (cargoList.includes(ship)) {
            return true;
        }
     }
     return false;
  };

  const deleteUnloadOrder = (cargo, carrier) => {
      let pendingUnloads = unloadOrders.get(carrier) || [];
      pendingUnloads = pendingUnloads.filter(ship => ship !== cargo);
      setUnloadOrders(new Map(unloadOrders.set(carrier, pendingUnloads)));
      console.log("delete order: unload " + cargo.name + " onto " + carrier.name);
  };

  const addFireOrder = (attacker, targets, ascending) => {
      const attackerData = fireOrders.get(attacker) || [];
      const data = { targets: targets, ascending: ascending };
      attackerData.push(data);
      setFireOrders(fireOrders);
      console.log("add order: fire " + attacker.name + " at " + targets + " (ascending " + ascending + ")");
  };

  const deleteFireOrder = (attacker) => {
      let newFireOrders = fireOrders.filter(ship => ship !== attacker);
      setFireOrders(newFireOrders);
      console.log("delete order: fire " + attacker.name);
  };

  const hasFireOrder = (ship) => {
       for (let fireList of fireOrders.keys()) {
          if (fireList.includes(ship)) {
              return true;
          }
       }
       return false;
  };

//  const submitOrders = async () => {
//    try {
//      // Make API request to submit orders to the server
//      const response = await fetch('/api/orders', {
//        method: 'POST',
//        headers: {
//          'Content-Type': 'application/json',
//        },
//        body: JSON.stringify(orders),
//      });
//
//      if (response.ok) {
//        // Orders submitted successfully, clear the orders array
//        setOrders([]);
//      } else {
//        throw new Error('Failed to submit orders');
//      }
//    } catch (error) {
//      console.error(error);
//    }
//  };

  const value = {
    loadOrders,
    addLoadOrder,
    deleteLoadOrder,
    hasLoadOrder,
    unloadOrders,
    addUnloadOrder,
    deleteUnloadOrder,
    hasUnloadOrder,
    fireOrders,
    addFireOrder,
    deleteFireOrder,
    hasFireOrder,
//    submitOrders,
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};

export { OrdersProvider, OrdersContext };