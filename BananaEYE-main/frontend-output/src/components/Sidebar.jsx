import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Menu, Settings, Leaf } from "lucide-react";
import { API_BASE } from "../config";

const Sidebar = ({ fontSize, setFontSize, colorScheme, setColorScheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [plantations, setPlantations] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch plantations from FastAPI backend (auto-refresh every 10s)
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE}/api/plantations`);
        if (!res.ok) throw new Error("Failed to fetch plantations");
        const data = await res.json();

        // 🔧 Normalize MongoDB data
        const normalized = data.map((p) => ({
          ...p,
          _id: p._id,
          id: p.id || p._id,
          name: p.name || "Unnamed Tree",
          yieldPrediction: p.yieldPrediction ?? "?",
          blackSigatokaInfection: p.blackSigatokaInfection || "unknown",
          datePlanted: p.datePlanted || "N/A",
          date:
            typeof p.date === "object" && p.date.$date
              ? p.date.$date
              : p.date || null,
        }));

        setPlantations(normalized);
      } catch (err) {
        console.error("Sidebar fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // ✅ Helper: Color badge
  const getStatusColor = (status) => {
    if (!status) return "bg-gray-200 text-gray-800";
    switch (status.toLowerCase()) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "infected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const colorSchemes = [
    { value: "natural", label: "Natural Green" },
    { value: "warm", label: "Warm Earth" },
    { value: "cool", label: "Cool Mint" },
    { value: "sunset", label: "Sunset Orange" },
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
          <SheetTitle style={{ color: `hsl(var(--plantation-header, 154, 50%, 35%))` }}>
            Plantation Dashboard
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* --- OVERVIEW TAB --- */}
          <TabsContent value="overview" className="mt-4">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading...</p>
            ) : (
              <div className="space-y-4">
                <h3
                  className="font-semibold flex items-center gap-2"
                  style={{
                    color: `hsl(var(--plantation-header, 154, 50%, 35%))`,
                  }}
                >
                  🌿 Plantation Overview
                </h3>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {plantations.length === 0 ? (
                    <p className="text-center text-gray-500">No plantation data available.</p>
                  ) : (
                    plantations.map((tree, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800">{tree.name}</span>
                          <Badge className={`${getStatusColor(tree.blackSigatokaInfection)} text-xs`}>
                            {tree.blackSigatokaInfection}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            Yield Prediction:{" "}
                            <span className="font-medium">{tree.yieldPrediction}%</span>
                          </p>

                        {tree.position && (
                          <p>
                            Position:{" "}
                          <span className="font-medium">
                            Row {tree.position?.row}, Col {tree.position?.col}
                          </span>
                          </p>
                          )}

                          <p>Last Update: {formatDate(tree.date)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* --- SETTINGS TAB --- */}
          <TabsContent value="settings" className="mt-4">
            <div className="space-y-6">
              <div>
                <h3
                  className="font-semibold mb-3"
                  style={{
                    color: `hsl(var(--plantation-header, 154, 50%, 35%))`,
                  }}
                >
                  Color Scheme
                </h3>
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorSchemes.map((scheme) => (
                      <SelectItem key={scheme.value} value={scheme.value}>
                        {scheme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* --- Quick Stats --- */}
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-700 mb-2">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="font-bold text-green-600">
                      {plantations.filter(
                        (t) => t.blackSigatokaInfection === "healthy"
                      ).length}
                    </div>
                    <div className="text-green-700">Healthy</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <div className="font-bold text-red-600">
                      {plantations.filter(
                        (t) => t.blackSigatokaInfection === "infected"
                      ).length}
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
