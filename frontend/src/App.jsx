import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AddEndpointModal from './components/AddEndpointModal';

import Dashboard from './pages/Dashboard';
import Endpoints from './pages/Endpoints';
import EndpointDetails from './pages/EndpointDetails';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import DemoScenario from './pages/DemoScenario';
import { alertsApi } from './api';

export default function App() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  const fetchActiveAlerts = async () => {
    try {
      const res = await alertsApi.list({ status: 'OPEN' });
      setActiveAlertsCount(res.data.length);
    } catch (err) {
      console.warn('Could not fetch active alert count:', err);
    }
  };

  useEffect(() => {
    fetchActiveAlerts();
    const interval = setInterval(fetchActiveAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#0b0f19] text-slate-100 antialiased">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar 
            onOpenAddModal={() => setIsAddModalOpen(true)} 
            activeAlertsCount={activeAlertsCount}
          />
          
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/endpoints" element={<Endpoints />} />
              <Route path="/endpoints/:id" element={<EndpointDetails />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/demo" element={<DemoScenario />} />
            </Routes>
          </main>
        </div>

        {/* Global Add Endpoint Modal */}
        <AddEndpointModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onEndpointAdded={() => {
            fetchActiveAlerts();
            // Trigger storage event or refresh
            window.location.reload();
          }}
        />
      </div>
    </BrowserRouter>
  );
}
