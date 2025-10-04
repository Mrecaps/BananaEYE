import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Menu, History, Settings, Calendar } from 'lucide-react';
import { mockPlantationData, getStatusColor } from '../mock/plantationData';

const Sidebar = ({ fontSize, setFontSize, colorScheme, setColorScheme }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Get all detection history from all trees
  const getAllDetectionHistory = () => {
    const allHistory = [];
    mockPlantationData.forEach(tree => {
      tree.detectionHistory.forEach(record => {
        allHistory.push({
          ...record,
          treeName: tree.name,
          treeId: tree.id
        });
      });
    });
    
    // Sort by date (most recent first)
    return allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const colorSchemes = [
    { value: 'natural', label: 'Natural Green' },
    { value: 'warm', label: 'Warm Earth' },
    { value: 'cool', label: 'Cool Mint' },
    { value: 'sunset', label: 'Sunset Orange' }
  ];

  const fontSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="fixed top-4 left-4 z-50 bg-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <Menu className="h-4 w-4 mr-2" />
          Menu
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-full sm:w-80 md:w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle style={{color: `hsl(var(--plantation-header, 154, 50%, 35%))`}}>
            Plantation Dashboard
          </SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="history" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="mt-4">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2" style={{color: `hsl(var(--plantation-header, 154, 50%, 35%))`}}>
                <Calendar className="h-4 w-4" />
                Detection History
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getAllDetectionHistory().slice(0, 20).map((record, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{record.treeName}</span>
                      <span className="text-sm text-gray-600">{formatDate(record.date)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={`${getStatusColor(record.status)} text-xs`}>
                        {record.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {record.confidence}% confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <div className="space-y-6">
            {/* <div>
                <h3 className="font-semibold mb-3" style={{color: `hsl(var(--plantation-header, 154, 50%, 35%))`}}>
                  Font Size
                </h3>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontSizes.map(size => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              FONT SIZE NEED TO CONFIGURE*/}
              <div>
                <h3 className="font-semibold mb-3" style={{color: `hsl(var(--plantation-header, 154, 50%, 35%))`}}>
                  Color Scheme
                </h3>
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorSchemes.map(scheme => (
                      <SelectItem key={scheme.value} value={scheme.value}>
                        {scheme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-700 mb-2">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="font-bold text-green-600">
                      {mockPlantationData.filter(t => t.blackSigatokaInfection === 'healthy').length}
                    </div>
                    <div className="text-green-700">Healthy</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <div className="font-bold text-red-600">
                      {mockPlantationData.filter(t => t.blackSigatokaInfection === 'infected').length}
                    </div>
                    <div className="text-red-700">Infected</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;