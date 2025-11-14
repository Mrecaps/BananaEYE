import React, { useState, useEffect } from 'react';
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserView from './components/UserView';
import TreeDetailModal from './components/TreeDetailModal';
import Sidebar from './components/Sidebar';
import { Toaster } from './components/ui/sonner';

const Home = () => {
  const [selectedTree, setSelectedTree] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [colorScheme, setColorScheme] = useState('natural');

  const handleTreeClick = (tree) => {
    setSelectedTree(tree);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTree(null);
  };

  // Apply font size class to body
  useEffect(() => {
    const fontSizeClasses = {
      'small': 'text-sm',
      'medium': 'text-base',
      'large': 'text-lg',
      'extra-large': 'text-xl'
    };
    
    // Remove existing font size classes
    document.body.className = document.body.className.replace(/text-(sm|base|lg|xl)/g, '');
    // Add new font size class
    document.body.classList.add(fontSizeClasses[fontSize]);
  }, [fontSize]);

  // Apply color scheme
  useEffect(() => {
    const colorSchemeClasses = {
      'natural': 'scheme-natural',
      'warm': 'scheme-warm', 
      'cool': 'scheme-cool',
      'sunset': 'scheme-sunset'
    };
    
    // Remove existing scheme classes
    document.body.className = document.body.className.replace(/scheme-\w+/g, '');
    // Add new scheme class
    document.body.classList.add(colorSchemeClasses[colorScheme]);
  }, [colorScheme]);

  return (
    <div className="relative">
      <Sidebar 
        fontSize={fontSize}
        setFontSize={setFontSize}
        colorScheme={colorScheme}
        setColorScheme={setColorScheme}
      />
      
      <UserView 
        onTreeClick={handleTreeClick}
        selectedTree={selectedTree}
      />
      
      <TreeDetailModal
        tree={selectedTree}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;