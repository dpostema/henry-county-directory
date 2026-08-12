"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { createListingAction } from "./actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddListingFormProps {
  categories: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}

export default function AddListingForm({ categories, cities }: AddListingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState("");
  
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
    Monday: { open: "09:00", close: "17:00", closed: false },
    Tuesday: { open: "09:00", close: "17:00", closed: false },
    Wednesday: { open: "09:00", close: "17:00", closed: false },
    Thursday: { open: "09:00", close: "17:00", closed: false },
    Friday: { open: "09:00", close: "17:00", closed: false },
    Saturday: { open: "09:00", close: "17:00", closed: false },
    Sunday: { open: "09:00", close: "17:00", closed: true },
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("hours_json", JSON.stringify(hours));

    const res = await createListingAction(formData);

    setLoading(false);
    if (res?.error) {
      setError(res.error);
    }
  };

  const handleHourChange = (day: string, field: "open" | "close", value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const toggleClosed = (day: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed }
    }));
  };

  const handleCityChange = (cityId: string | null) => {
    if (!cityId) return;
    const city = cities.find(c => c.id === cityId);
    if (city) {
      let zip = "";
      switch (city.name.toLowerCase()) {
        case "mcdonough": zip = "30253"; break;
        case "stockbridge": zip = "30281"; break;
        case "hampton": zip = "30228"; break;
        case "locust grove": zip = "30248"; break;
        case "jackson": zip = "30233"; break;
        case "griffin": zip = "30223"; break;
        case "jonesboro": zip = "30236"; break;
      }
      if (zip) setPostalCode(zip);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      
      {/* SECTION: BASIC INFO */}
      <div>
        <h3 className="text-sm font-bold text-brandText-light uppercase tracking-wider mb-6 border-b border-brandBorder-light pb-2">Basic Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-1.5">Business Name *</label>
            <input type="text" name="name" required placeholder="e.g. Acme Corporation" className="w-full px-4 py-2.5 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed transition-colors cursor-pointer" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-1.5">Category *</label>
            <Select name="categoryId" required>
      <SelectTrigger className="w-full px-4 py-2.5 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed  transition-colors  cursor-pointer bg-white">
        <SelectValue placeholder="Select Category..." />
      </SelectTrigger>
      <SelectContent>
        
              <SelectItem value="___placeholder___" disabled>Select Category...</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            
      </SelectContent>
    </Select>
          </div>
          <div>
            <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-1.5">Business Email *</label>
            <input type="email" name="email" required placeholder="contact@business.com" className="w-full px-4 py-2.5 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed transition-colors cursor-pointer" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-1.5">Website URL (Optional)</label>
            <input type="text" name="website" placeholder="https://www.example.com" className="w-full px-4 py-2.5 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed transition-colors cursor-pointer" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-1.5">Phone Number</label>
            <input type="text" name="phone" placeholder="(555) 123-4567" className="w-full px-4 py-2.5 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed transition-colors cursor-pointer" />
          </div>
        </div>
      </div>

      {/* SECTION: LISTING DETAILS */}
      <div>
        <h3 className="text-sm font-bold text-brandText-light uppercase tracking-wider mb-6 border-b border-brandBorder-light pb-2">Listing Details</h3>
        
        <div className="mb-6">
          <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-1.5">Cover Image</label>
          <input 
            type="file" 
            name="coverImage" 
            accept="image/*" 
            className="w-full px-4 py-2.5 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed transition-colors bg-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brandRed file:text-white hover:file:bg-brandRed/90" 
          />
          <p className="text-xs text-brandText-light mt-1.5">Upload a high-quality image (JPG, PNG, WebP) up to 5MB.</p>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-1.5">Business Description</label>
          <textarea name="description" rows={4} placeholder="Tell us about your business, products, and services..." className="w-full px-4 py-2.5 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed transition-colors resize-none cursor-pointer" />
        </div>
      </div>

      {/* SECTION: OPERATING HOURS */}
      <div>
        <h3 className="text-sm font-bold text-brandText-light uppercase tracking-wider mb-6 border-b border-brandBorder-light pb-2">Operating Hours</h3>
        <div className="space-y-3">
          {days.map(day => {
            const isClosed = hours[day].closed;
            return (
              <div key={day} className="flex items-center justify-between p-4 border border-brandBorder-light rounded-lg bg-white shadow-sm cursor-pointer">
                <div className="flex items-center gap-4 min-w-[140px]">
                  {/* Toggle */}
                  <button 
                    type="button" 
                    onClick={() => toggleClosed(day)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${!isClosed ? 'bg-[#0f172a]' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${!isClosed ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                  <span className={`text-sm font-bold tracking-wide uppercase ${isClosed ? 'text-gray-400' : 'text-brandText-dark'}`}>{day}</span>
                </div>

                {isClosed ? (
                  <div className="flex-1 flex justify-start items-center text-gray-300 font-medium italic pl-4 cursor-pointer">
                    CLOSED
                  </div>
                ) : (
                  <div className="flex flex-1 items-center gap-4 pl-4">
                    <Select value={hours[day].open} onValueChange={(val) => handleHourChange(day, "open", val || "")}>
                      <SelectTrigger className="flex-1 px-3 py-2 bg-gray-50 border border-brandBorder-light rounded-lg text-sm font-medium focus:outline-none focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="12:00 AM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 24}).map((_, i) => (
                          <SelectItem key={`open-${i}`} value={`${i.toString().padStart(2, '0')}:00`}>
                            {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i-12}:00 PM`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-brandText-light text-xs font-bold">TO</span>
                    <Select value={hours[day].close} onValueChange={(val) => handleHourChange(day, "close", val || "")}>
                      <SelectTrigger className="flex-1 px-3 py-2 bg-gray-50 border border-brandBorder-light rounded-lg text-sm font-medium focus:outline-none focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="12:00 PM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 24}).map((_, i) => (
                          <SelectItem key={`close-${i}`} value={`${i.toString().padStart(2, '0')}:00`}>
                            {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i-12}:00 PM`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION: LOCATION DETAILS */}
      <div>
        <h3 className="text-sm font-bold text-brandText-light uppercase tracking-wider mb-6 border-b border-brandBorder-light pb-2">Location Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-1.5">Street Address</label>
            <input type="text" name="streetAddress" placeholder="123 Main St" className="w-full px-4 py-2.5 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed transition-colors cursor-pointer" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-1.5">City *</label>
            <Select name="cityId" required onValueChange={handleCityChange}>
      <SelectTrigger className="w-full px-4 py-2.5 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed  transition-colors  cursor-pointer bg-white">
        <SelectValue placeholder="Select City..." />
      </SelectTrigger>
      <SelectContent>
        
              <SelectItem value="___placeholder___" disabled>Select City...</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>{city.name}, GA</SelectItem>
              ))}
            
      </SelectContent>
    </Select>
          </div>
          <div>
            <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-1.5">State</label>
            <input type="text" name="state" value="GA" readOnly className="w-full px-4 py-2.5 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed transition-colors bg-gray-100 cursor-not-allowed text-brandText-light font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-brandText-dark uppercase tracking-wider mb-1.5">Postal Code</label>
            <input type="text" name="postalCode" value={postalCode || ""} onChange={(e) => setPostalCode(e.target.value)} placeholder="30253" className="w-full px-4 py-2.5 border border-brandBorder-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandRed/20 focus:border-brandRed transition-colors cursor-pointer" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-brandRed bg-brandRed-muted rounded-lg border border-brandRed/20">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brandRed hover:bg-brandRed-hover text-white py-4 rounded-full font-bold text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Creating Listing..." : "Create Listing"}
      </button>
    </form>
  );
}
