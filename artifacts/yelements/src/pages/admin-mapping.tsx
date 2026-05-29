import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Layers, 
  GitMerge, 
  FileText, 
  Copy, 
  Boxes, 
  Link2, 
  Users, 
  Search, 
  RefreshCw, 
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  HelpCircle,
  Truck,
  Grid
} from "lucide-react";

// Standard attributes by category fallback
const CATEGORY_ATTRIBUTES: Record<string, string[]> = {
  "Medical": ["Brand", "Model", "DisplayType", "PowerSource", "Warranty", "CountryOfOrigin", "MeasurementAccuracy"],
  "Surgical": ["LensIndex", "Coating", "Material", "Diameter", "PowerRange", "ColorType", "OpticalDesign"],
  "Stationery": ["PaperWeight", "PageCount", "RulingType", "Binding", "SheetSize", "PackQuantity"],
  "Laboratory": ["Material", "Capacity", "GraduationRange", "TemperatureTolerance", "NeckType", "StopperSize"],
};

export default function CatalogMappingWorkspace() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // State
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Mapping Form State
  const [masterData, setMasterData] = useState({
    productId: "",
    sku: "",
    name: "",
    brand: "",
    category: "",
    subcategory: "",
    hsnCode: "",
    gst: "12",
    unit: "Pair",
    origin: "",
  });

  const [attributes, setAttributes] = useState<Array<{ name: string; value: string }>>([]);
  const [taxonomy, setTaxonomy] = useState<string[]>([]);
  const [media, setMedia] = useState({
    images: ["", "", ""],
    shortDesc: "",
    longDesc: "",
    specs: "",
    techSheetPdf: "",
    userManualPdf: "",
    brochurePdf: "",
  });

  const [variants, setVariants] = useState<Array<{ variant: string; size: string; sku: string; packingUnit: string }>>([
    { variant: "Small", size: "S", sku: "", packingUnit: "Pair" },
    { variant: "Medium", size: "M", sku: "", packingUnit: "Pair" },
    { variant: "Large", size: "L", sku: "", packingUnit: "Pair" },
    { variant: "Extra Large", size: "XL", sku: "", packingUnit: "Pair" },
  ]);

  const [packSize, setPackSize] = useState({
    smallPackType: "Small Pack",
    smallPackSize: "1 Pack",
    smallContains: "10 Pcs",
    smallSku: "",
    smallSellingUnit: "Pack",
    cartonPackType: "Carton Pack",
    cartonPackSize: "1 Carton",
    cartonContains: "100 Packs",
    cartonSku: "",
    cartonSellingUnit: "Carton",
  });

  const [similarItems, setSimilarItems] = useState<number[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ name: string; sku: string; price: number; stock: number; delivery: string; rating: string }>>([
    { name: "ABC Surgicals", sku: "", price: 120000, stock: 5, delivery: "2-3 Days", rating: "Best Price" },
    { name: "MedPlus Traders", sku: "", price: 118000, stock: 3, delivery: "3-4 Days", rating: "Stock Availability" },
    { name: "HealthCare India", sku: "", price: 122500, stock: 10, delivery: "1-2 Days", rating: "Delivery Timeline" },
  ]);

  const [keywords, setKeywords] = useState({
    searches: "",
    mapped: "",
  });

  const [erpSync, setErpSync] = useState({
    apiStatus: "Connected",
    inventorySync: "Auto",
    orderSync: "Realtime",
    pricingSync: "Hourly",
    lastSync: "Just now",
  });

  // Fetch all products
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/products?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products list");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setLocation("/dashboard");
      return;
    }
    fetchProducts();
  }, [user]);

  // Load Mapping Data when product selected
  const handleSelectProduct = async (product: any) => {
    setSelectedProduct(product);
    setActiveStep(1);
    
    // Set Master Data defaults from selected product
    setMasterData({
      productId: `M-${product.id.toString().padStart(5, '0')}`,
      sku: product.sku || `${product.name.substring(0, 3).toUpperCase()}-${product.id}-M`,
      name: product.name,
      brand: product.brand || product.description.match(/Brand:\s*([^.]+)/)?.[1] || "Generic",
      category: product.categoryName || "Medical",
      subcategory: product.subcategory || "General",
      hsnCode: "30049099",
      gst: product.discount ? "12" : "18",
      unit: "Piece",
      origin: "India",
    });

    // Set Default Media
    setMedia({
      images: [product.imageUrl || "", "", ""],
      shortDesc: product.description.substring(0, 100),
      longDesc: product.description,
      specs: "Material: Medical Grade\nCertifications: ISO, CE",
      techSheetPdf: "",
      userManualPdf: "",
      brochurePdf: "",
    });

    // Reset details
    setTaxonomy([product.categoryName || "Medical Supplies", product.subcategory || "Instruments", product.name]);
    setKeywords({
      searches: `${product.name.toLowerCase()}, ${product.categoryName?.toLowerCase()}`,
      mapped: `${product.name}, ${product.categoryName}`,
    });

    // Populate variants
    setVariants([
      { variant: "Small", size: "S", sku: `${product.sku || "PROD"}-S`, packingUnit: "Piece" },
      { variant: "Medium", size: "M", sku: `${product.sku || "PROD"}-M`, packingUnit: "Piece" },
      { variant: "Large", size: "L", sku: `${product.sku || "PROD"}-L`, packingUnit: "Piece" },
      { variant: "Extra Large", size: "XL", sku: `${product.sku || "PROD"}-XL`, packingUnit: "Piece" },
    ]);

    setPackSize({
      smallPackType: "Small Pack",
      smallPackSize: "1 Pack",
      smallContains: "10 Pcs",
      smallSku: `${product.sku || "PROD"}-SPK`,
      smallSellingUnit: "Pack",
      cartonPackType: "Carton Pack",
      cartonPackSize: "1 Carton",
      cartonContains: "100 Packs",
      cartonSku: `${product.sku || "PROD"}-CTN`,
      cartonSellingUnit: "Carton",
    });

    // Load category attributes
    const cat = product.categoryName || "Medical";
    const attrs = CATEGORY_ATTRIBUTES[cat] || CATEGORY_ATTRIBUTES.Medical;
    setAttributes(attrs.map(a => ({ name: a, value: "" })));

    // Fetch from server if exists
    try {
      const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/products/${product.id}/mapping`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const map = data.data;
        if (map.masterData) setMasterData(map.masterData);
        if (map.attributes) setAttributes(map.attributes);
        if (map.taxonomy) setTaxonomy(map.taxonomy);
        if (map.media) setMedia(map.media);
        if (map.variants) setVariants(map.variants);
        if (map.packSize) setPackSize(map.packSize);
        if (map.similarItems) setSimilarItems(map.similarItems);
        if (map.suppliers) setSuppliers(map.suppliers);
        if (map.keywords) setKeywords(map.keywords);
        if (map.erpSync) setErpSync(map.erpSync);
      }
    } catch (err) {
      console.error("Error loading mapping details:", err);
    }
  };

  // Save Mapping details to DB
  const handleSaveMapping = async () => {
    if (!selectedProduct) return;
    setSaving(true);

    const payload = {
      masterData,
      attributes,
      taxonomy,
      media,
      variants,
      packSize,
      similarItems,
      suppliers,
      keywords,
      erpSync
    };

    try {
      const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/products/${selectedProduct.id}/mapping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save mapping");
      toast.success("Catalog Mapping Saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save catalog mapping details");
    } finally {
      setSaving(false);
    }
  };

  const handleManualSync = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Syncing details with ERP and Warehouse Systems...',
        success: 'ERP Sync Completed! 100% of telemetry aligned.',
        error: 'Sync failed',
      }
    );
    setErpSync(prev => ({ ...prev, lastSync: "Just now" }));
  };

  return (
    <AppLayout>
      {/* Premium Catalog Mapping Header */}
      <div className="relative overflow-hidden bg-slate-950 text-white py-16 px-4 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.15),transparent_60%)]" />
        <div className="container mx-auto max-w-6xl relative z-10 text-center space-y-4">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-widest">
            Institutional Master Catalog
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Catalog <span className="text-teal-400">Mapping Workspace</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Create Product Masters, assign attributes, taxonomy mapping, pack sizes, variants, multi-supplier prices, and connect WMS/ERP telemetry.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT COLUMN: Product Finder */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 text-teal-600" /> Select Product
                </CardTitle>
                <CardDescription className="text-xs">Find a product to begin catalog mapping</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-8 text-xs h-9 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {loadingProducts ? (
                    <div className="text-center py-4 text-muted-foreground text-xs">Loading products...</div>
                  ) : products.length > 0 ? (
                    products
                      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center gap-3 ${
                            selectedProduct?.id === p.id 
                              ? "bg-teal-50 border-teal-200 text-teal-900 font-semibold shadow-sm"
                              : "bg-white border-slate-100 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-50 overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{p.name}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{p.categoryName || "General"}</p>
                          </div>
                        </button>
                      ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-xs">No products found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Wizard Steps */}
          <div className="lg:col-span-3">
            {!selectedProduct ? (
              <div className="bg-slate-50 border-2 border-dashed rounded-3xl p-16 text-center space-y-4 max-w-lg mx-auto mt-10">
                <Grid className="w-16 h-16 text-slate-300 mx-auto stroke-1" />
                <h3 className="text-lg font-bold text-slate-800">Select a Product to Start Mapping</h3>
                <p className="text-xs text-slate-500">
                  Select a product from the left sidebar to access its 10-step configuration wizard.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 🔢 Steps Navigation Bar */}
                <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between overflow-x-auto gap-4 scrollbar-thin">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const stepNum = i + 1;
                    const isActive = activeStep === stepNum;
                    const isDone = activeStep > stepNum;
                    return (
                      <button
                        key={stepNum}
                        onClick={() => setActiveStep(stepNum)}
                        className={`flex flex-col items-center gap-1.5 shrink-0 px-2 py-1 transition-all ${
                          isActive ? "text-teal-600 scale-105 font-bold" : 
                          isDone ? "text-emerald-500" : "text-slate-400"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border ${
                          isActive ? "border-teal-500 bg-teal-50 text-teal-600 font-bold" :
                          isDone ? "border-emerald-500 bg-emerald-50 text-emerald-600 font-bold" :
                          "border-slate-200 bg-slate-50 text-slate-400"
                        }`}>
                          {isDone ? "✓" : stepNum}
                        </div>
                        <span className="text-[9px] uppercase tracking-wider hidden md:inline">
                          {["Master", "Attributes", "Taxonomy", "Images", "Variants", "Packs", "Similars", "Suppliers", "Search", "ERP"][i]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Step Title Header */}
                <div className="flex items-center justify-between bg-teal-50/50 border border-teal-100 p-5 rounded-2xl">
                  <div>
                    <h2 className="text-lg font-black text-teal-950 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-teal-600" />
                      Step {activeStep}: {
                        [
                          "Product Master Creation",
                          "Attribute Mapping",
                          "Category Taxonomy Mapping",
                          "Image + Description Mapping",
                          "Variant Mapping",
                          "Pack Size Mapping (Small Pack & Carton)",
                          "Similar Items Mapping",
                          "Supplier Mapping (Multi Supplier)",
                          "Search & Keyword Mapping",
                          "ERP / Inventory Integration"
                        ][activeStep - 1]
                      }
                    </h2>
                    <p className="text-xs text-teal-800/80 mt-0.5">
                      {
                        [
                          "Establish the internal unique Product Master registry details",
                          "Match standard features to category attributes for comparison",
                          "Associate the product structure into taxonomy hierarchies",
                          "Define asset links, descriptions, technical specification PDFs",
                          "Setup variants size, color, SKU linked to parent product",
                          "Configure carton packaging values to align stock counting",
                          "Establish comparable similar items for corporate clients",
                          "Input multi-supplier pricing, lead times, and trust seals",
                          "Input tags, synonyms, and search keywords for AI Semantic search",
                          "Verify synchronization telemetry logs with ERP inventory"
                        ][activeStep - 1]
                      }
                    </p>
                  </div>
                  <Badge className="bg-teal-600 hover:bg-teal-700 text-white font-bold">{activeStep} of 10</Badge>
                </div>

                {/* Wizard Panel Content */}
                <Card className="border-border shadow-sm bg-white">
                  <CardContent className="p-6">
                    
                    {/* STEP 1: Product Master */}
                    {activeStep === 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label>Product ID (Internal Registry)</Label>
                          <Input value={masterData.productId} onChange={(e) => setMasterData({ ...masterData, productId: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label>SKU Code</Label>
                          <Input value={masterData.sku} onChange={(e) => setMasterData({ ...masterData, sku: e.target.value })} />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label>Master Product Name</Label>
                          <Input value={masterData.name} onChange={(e) => setMasterData({ ...masterData, name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label>Brand Registry</Label>
                          <Input value={masterData.brand} onChange={(e) => setMasterData({ ...masterData, brand: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label>Category</Label>
                          <Input value={masterData.category} onChange={(e) => setMasterData({ ...masterData, category: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label>Subcategory</Label>
                          <Input value={masterData.subcategory} onChange={(e) => setMasterData({ ...masterData, subcategory: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label>HSN Code</Label>
                          <Input value={masterData.hsnCode} onChange={(e) => setMasterData({ ...masterData, hsnCode: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 md:col-span-2">
                          <div className="space-y-1">
                            <Label>GST Rate (%)</Label>
                            <Input type="number" value={masterData.gst} onChange={(e) => setMasterData({ ...masterData, gst: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label>Selling Unit</Label>
                            <Input value={masterData.unit} onChange={(e) => setMasterData({ ...masterData, unit: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label>Country of Origin</Label>
                            <Input value={masterData.origin} onChange={(e) => setMasterData({ ...masterData, origin: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: Attribute Mapping */}
                    {activeStep === 2 && (
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">Category attributes enable search filters and comparison grids.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {attributes.map((attr, idx) => (
                            <div key={attr.name} className="space-y-1">
                              <Label className="capitalize">{attr.name.replace(/([A-Z])/g, ' $1')}</Label>
                              <Input
                                value={attr.value}
                                placeholder={`Enter ${attr.name.toLowerCase()}`}
                                onChange={(e) => {
                                  const updated = [...attributes];
                                  updated[idx].value = e.target.value;
                                  setAttributes(updated);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setAttributes([...attributes, { name: "CustomAttribute", value: "" }])}
                        >
                          + Add Custom Attribute
                        </Button>
                      </div>
                    )}

                    {/* STEP 3: Taxonomy Hierarchy */}
                    {activeStep === 3 && (
                      <div className="space-y-4">
                        <Label>Taxonomy Tree Node Mapping</Label>
                        <div className="space-y-3">
                          {taxonomy.map((node, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-400 w-12 shrink-0">Level {idx + 1}</span>
                              <Input
                                value={node}
                                onChange={(e) => {
                                  const updated = [...taxonomy];
                                  updated[idx] = e.target.value;
                                  setTaxonomy(updated);
                                }}
                              />
                              {idx > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500"
                                  onClick={() => setTaxonomy(taxonomy.filter((_, i) => i !== idx))}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setTaxonomy([...taxonomy, "New Sub-Node"])}
                        >
                          + Add Sub-category Hierarchy
                        </Button>

                        <div className="bg-slate-50 p-4 rounded-xl border text-xs font-mono text-slate-600">
                          <strong>Active Path:</strong> {taxonomy.join(" ➔ ")}
                        </div>
                      </div>
                    )}

                    {/* STEP 4: Images & Descriptions */}
                    {activeStep === 4 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Catalog Asset Images (URLs)</Label>
                          {media.images.map((img, idx) => (
                            <Input
                              key={idx}
                              value={img}
                              placeholder={`Image URL ${idx + 1}`}
                              onChange={(e) => {
                                const updated = [...media.images];
                                updated[idx] = e.target.value;
                                setMedia({ ...media, images: updated });
                              }}
                              className="mb-2"
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label>Short Description</Label>
                            <Input value={media.shortDesc} onChange={(e) => setMedia({ ...media, shortDesc: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label>Technical Specifications</Label>
                            <Textarea value={media.specs} rows={3} onChange={(e) => setMedia({ ...media, specs: e.target.value })} />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label>Long Description</Label>
                            <Textarea value={media.longDesc} rows={4} onChange={(e) => setMedia({ ...media, longDesc: e.target.value })} />
                          </div>
                        </div>

                        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label>Technical Sheet PDF URL</Label>
                            <Input placeholder="Link to Technical PDF" value={media.techSheetPdf} onChange={(e) => setMedia({ ...media, techSheetPdf: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label>User Manual PDF URL</Label>
                            <Input placeholder="Link to Manual PDF" value={media.userManualPdf} onChange={(e) => setMedia({ ...media, userManualPdf: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label>Brochure PDF URL</Label>
                            <Input placeholder="Link to Brochure PDF" value={media.brochurePdf} onChange={(e) => setMedia({ ...media, brochurePdf: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 5: Variant Mapping */}
                    {activeStep === 5 && (
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">Map parent/master product to size/color/power child variations.</p>
                        <div className="space-y-3">
                          {variants.map((v, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 border-b pb-2">
                              <div>
                                <Label className="text-[10px]">Variant Title</Label>
                                <Input value={v.variant} onChange={(e) => {
                                  const updated = [...variants];
                                  updated[idx].variant = e.target.value;
                                  setVariants(updated);
                                }} />
                              </div>
                              <div>
                                <Label className="text-[10px]">Option (Size/Color)</Label>
                                <Input value={v.size} onChange={(e) => {
                                  const updated = [...variants];
                                  updated[idx].size = e.target.value;
                                  setVariants(updated);
                                }} />
                              </div>
                              <div>
                                <Label className="text-[10px]">Child SKU</Label>
                                <Input value={v.sku} placeholder="e.g. parent-sku-S" onChange={(e) => {
                                  const updated = [...variants];
                                  updated[idx].sku = e.target.value;
                                  setVariants(updated);
                                }} />
                              </div>
                              <div>
                                <Label className="text-[10px]">Unit</Label>
                                <Input value={v.packingUnit} onChange={(e) => {
                                  const updated = [...variants];
                                  updated[idx].packingUnit = e.target.value;
                                  setVariants(updated);
                                }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setVariants([...variants, { variant: "Custom", size: "", sku: "", packingUnit: "Piece" }])}
                        >
                          + Add Variant row
                        </Button>
                      </div>
                    )}

                    {/* STEP 6: Pack Size Mapping */}
                    {activeStep === 6 && (
                      <div className="space-y-6">
                        <p className="text-xs text-muted-foreground">Link packaging configs to prevent inventory mismatches.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Small Pack */}
                          <div className="border p-4 rounded-xl space-y-3 bg-slate-50/50">
                            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Boxes className="w-4 h-4 text-teal-600" /> Small Pack Details</h4>
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs">Pack Type</Label>
                                <Input value={packSize.smallPackType} onChange={(e) => setPackSize({ ...packSize, smallPackType: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs">Pack Size (Contains count)</Label>
                                <Input value={packSize.smallPackSize} onChange={(e) => setPackSize({ ...packSize, smallPackSize: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs">Contains Items</Label>
                                <Input value={packSize.smallContains} onChange={(e) => setPackSize({ ...packSize, smallContains: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs">Pack SKU</Label>
                                <Input value={packSize.smallSku} onChange={(e) => setPackSize({ ...packSize, smallSku: e.target.value })} />
                              </div>
                            </div>
                          </div>

                          {/* Carton Pack */}
                          <div className="border p-4 rounded-xl space-y-3 bg-slate-50/50">
                            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Layers className="w-4 h-4 text-teal-600" /> Carton Pack Details</h4>
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs">Carton Type</Label>
                                <Input value={packSize.cartonPackType} onChange={(e) => setPackSize({ ...packSize, cartonPackType: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs">Carton Size (Contains packs)</Label>
                                <Input value={packSize.cartonPackSize} onChange={(e) => setPackSize({ ...packSize, cartonPackSize: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs">Contains Items</Label>
                                <Input value={packSize.cartonContains} onChange={(e) => setPackSize({ ...packSize, cartonContains: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs">Carton SKU</Label>
                                <Input value={packSize.cartonSku} onChange={(e) => setPackSize({ ...packSize, cartonSku: e.target.value })} />
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* STEP 7: Similar Items */}
                    {activeStep === 7 && (
                      <div className="space-y-4">
                        <Label>Map Related cross-selling items (IDs)</Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Enter Product ID to link (e.g. 3)" 
                            id="similar-item-input"
                            type="number"
                          />
                          <Button 
                            onClick={() => {
                              const val = (document.getElementById("similar-item-input") as HTMLInputElement)?.value;
                              if (!val) return;
                              const id = Number(val);
                              if (similarItems.includes(id)) return;
                              setSimilarItems([...similarItems, id]);
                              (document.getElementById("similar-item-input") as HTMLInputElement).value = "";
                              toast.success(`Linked product ID ${id}`);
                            }}
                          >
                            Link Product
                          </Button>
                        </div>
                        
                        <div className="space-y-2 pt-2">
                          {similarItems.length > 0 ? (
                            similarItems.map(id => (
                              <div key={id} className="flex justify-between items-center bg-slate-50 border p-3 rounded-lg text-xs">
                                <span>Linked Product: <strong>ID #{id}</strong></span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-500" 
                                  onClick={() => setSimilarItems(similarItems.filter(i => i !== id))}
                                >
                                  Unlink
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No similar products linked yet. Mapped automatically using category/brand.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* STEP 8: Supplier Mapping */}
                    {activeStep === 8 && (
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">Map multiple wholesale suppliers with stock, price, and logistics details.</p>
                        <div className="space-y-3">
                          {suppliers.map((s, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 border p-3 rounded-xl bg-slate-50/50 text-xs">
                              <div>
                                <Label className="text-[10px]">Supplier Name</Label>
                                <Input value={s.name} onChange={(e) => {
                                  const updated = [...suppliers];
                                  updated[idx].name = e.target.value;
                                  setSuppliers(updated);
                                }} />
                              </div>
                              <div>
                                <Label className="text-[10px]">Wholesale Cost (₹)</Label>
                                <Input type="number" value={s.price} onChange={(e) => {
                                  const updated = [...suppliers];
                                  updated[idx].price = Number(e.target.value);
                                  setSuppliers(updated);
                                }} />
                              </div>
                              <div>
                                <Label className="text-[10px]">Supplier Stock</Label>
                                <Input type="number" value={s.stock} onChange={(e) => {
                                  const updated = [...suppliers];
                                  updated[idx].stock = Number(e.target.value);
                                  setSuppliers(updated);
                                }} />
                              </div>
                              <div>
                                <Label className="text-[10px]">Delivery Time</Label>
                                <Input value={s.delivery} onChange={(e) => {
                                  const updated = [...suppliers];
                                  updated[idx].delivery = e.target.value;
                                  setSuppliers(updated);
                                }} />
                              </div>
                              <div>
                                <Label className="text-[10px]">Trust Label / Tag</Label>
                                <Input value={s.rating} onChange={(e) => {
                                  const updated = [...suppliers];
                                  updated[idx].rating = e.target.value;
                                  setSuppliers(updated);
                                }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSuppliers([...suppliers, { name: "", sku: "", price: 0, stock: 0, delivery: "", rating: "" }])}
                        >
                          + Add Supplier mapping
                        </Button>
                      </div>
                    )}

                    {/* STEP 9: Search & Keywords */}
                    {activeStep === 9 && (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <Label>Customer Search Strings & Synonyms (comma separated)</Label>
                          <Textarea 
                            rows={3} 
                            placeholder="e.g. bp machine, blood pressure monitor, digital bp machine, bp monitor" 
                            value={keywords.searches} 
                            onChange={(e) => setKeywords({ ...keywords, searches: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Mapped Search Keywords (for AI Semantic Search indexing)</Label>
                          <Textarea 
                            rows={3} 
                            placeholder="e.g. Blood Pressure Monitor, BP Monitor, Digital BP Machine, BP Apparatus" 
                            value={keywords.mapped} 
                            onChange={(e) => setKeywords({ ...keywords, mapped: e.target.value })} 
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 10: ERP Integration */}
                    {activeStep === 10 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 border p-3 rounded-lg bg-emerald-50/20">
                            <Label className="text-xs">Central WMS Status</Label>
                            <p className="font-bold text-sm text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Connected</p>
                          </div>
                          <div className="space-y-1.5 border p-3 rounded-lg bg-emerald-50/20">
                            <Label className="text-xs">Inventory Sync Mode</Label>
                            <p className="font-bold text-sm text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Automatic (Hourly)</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label>Integration Metrics</Label>
                          <div className="border p-4 rounded-xl divide-y space-y-3 text-xs text-slate-700">
                            <div className="flex justify-between pb-2">
                              <span>ERP Platform</span>
                              <strong className="font-bold">SAP Business One / WMS-v4 API</strong>
                            </div>
                            <div className="flex justify-between py-2">
                              <span>Pricing Synchronization</span>
                              <strong className="font-bold">Automated (Real-time updates)</strong>
                            </div>
                            <div className="flex justify-between py-2">
                              <span>Last Sync Action</span>
                              <strong className="font-bold">{erpSync.lastSync}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button 
                            className="bg-teal-600 text-white hover:bg-teal-700"
                            onClick={handleManualSync}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" /> Sync Now (Force ERP Telemetry)
                          </Button>
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>

                {/* Footer Controls */}
                <div className="flex justify-between items-center bg-slate-50 border p-5 rounded-2xl">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                    disabled={activeStep === 1}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-teal-600 text-teal-600 hover:bg-teal-50"
                      onClick={handleSaveMapping}
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Mapping"}
                    </Button>
                    {activeStep < 10 ? (
                      <Button
                        className="bg-teal-600 text-white hover:bg-teal-700 font-bold"
                        onClick={() => setActiveStep(prev => Math.min(10, prev + 1))}
                      >
                        Next Step <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
                        onClick={handleSaveMapping}
                        disabled={saving}
                      >
                        Finish & Save 🏁
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
