import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import HomePage from './pages/HomePage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import PlanNewPage from './pages/PlanNewPage.jsx';
import GeneratePreviewPage from './pages/GeneratePreviewPage.jsx';
import TripDetailPage from './pages/TripDetailPage.jsx';
import TripsPage from './pages/TripsPage.jsx';
import JournalCreatePage from './pages/JournalCreatePage.jsx';
import JournalEditorPage from './pages/JournalEditorPage.jsx';
import PrintCustomizePage from './pages/PrintCustomizePage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';

export default function App(){
 return <AppShell><Routes>
   <Route path="/" element={<HomePage/>}/>
   <Route path="/plan/new" element={<PlanNewPage/>}/>
   <Route path="/plan/generate" element={<GeneratePreviewPage/>}/>
   <Route path="/trip/:id" element={<TripDetailPage/>}/>
   <Route path="/trips" element={<TripsPage/>}/>
   <Route path="/journal/create" element={<JournalCreatePage/>}/>
   <Route path="/journal/edit/:id" element={<JournalEditorPage/>}/>
   <Route path="/print/customize" element={<PrintCustomizePage/>}/>
   <Route path="/orders" element={<OrdersPage/>}/>
   <Route path="*" element={<Navigate to="/" replace/>}/>
 </Routes></AppShell>
}
