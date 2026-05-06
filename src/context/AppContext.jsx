import React, { createContext, useContext, useReducer } from "react";

const AppContext = createContext();

const initialState = {
  devices: [],
  alerts: [],
  detections: [],
  settings: {
    notifications: true,
    autoRefresh: true,
    usageThreshold: 80,
  },
  user: {
    name: "Admin User",
    role: "Administrator",
  },
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_DEVICES":
      return { ...state, devices: action.payload };
    case "ADD_ALERT":
      return { ...state, alerts: [action.payload, ...state.alerts] };
    case "ADD_DETECTION":
      // Keep only last 100 detections in memory
      return {
        ...state,
        detections: [action.payload, ...state.detections].slice(0, 100),
      };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
