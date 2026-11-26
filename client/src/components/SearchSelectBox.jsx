import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X, Loader2 } from "lucide-react";

/**
 * Reusable Searchable & Scrollable Selector Component for UP Land Portal
 * Supports:
 * - Instant type-to-search in both Hindi and English
 * - Smooth scrollable dropdown (max-h-72 overflow-y-auto z-50)
 * - Click-anywhere to open
 * - onMouseDown instant selection (prevents blur race condition)
 * - Green ✓ checkmark on active selected item
 * - Clear ✕ button to reset/change selection
 * - Auto-open support when previous cascading step completes
 */
export default function SearchSelectBox({
  stepNumber = 1,
  label = "",
  badge = "",
  placeholder = "यहाँ क्लिक करें या नाम लिखें...",
  disabled = false,
  disabledText = "🔒 पहले पिछला विकल्प चुनें",
  items = [],
  selectedValue = "",
  selectedItem = null,
  onSelect,
  onClear,
  isOpen = false,
  onOpenChange,
  colorTheme = "emerald",
  loading = false,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const open = onOpenChange ? isOpen : internalOpen;
  const setOpen = (val) => {
    if (onOpenChange) {
      onOpenChange(val);
    } else {
      setInternalOpen(val);
    }
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open && !disabled) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [open, disabled]);

  // Theme color maps
  const themeStyles = {
    emerald: {
      stepBadge: "bg-emerald-700 text-white",
      labelText: "text-emerald-900",
      topBadge: "bg-emerald-100 text-emerald-800",
      borderActive: "border-emerald-500 ring-2 ring-emerald-300",
      borderIdle: "border-emerald-300 bg-emerald-50/60",
      itemHover: "hover:bg-emerald-50 text-gray-900",
      itemActive: "bg-emerald-100/80 text-emerald-950 font-bold",
      checkIcon: "text-emerald-700",
      focusRing: "focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-500",
    },
    blue: {
      stepBadge: "bg-blue-700 text-white",
      labelText: "text-blue-900",
      topBadge: "bg-blue-100 text-blue-800",
      borderActive: "border-blue-500 ring-2 ring-blue-300",
      borderIdle: "border-blue-300 bg-blue-50/60",
      itemHover: "hover:bg-blue-50 text-gray-900",
      itemActive: "bg-blue-100/80 text-blue-950 font-bold",
      checkIcon: "text-blue-700",
      focusRing: "focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-500",
    },
    amber: {
      stepBadge: "bg-amber-600 text-white",
      labelText: "text-amber-900",
      topBadge: "bg-amber-100 text-amber-800",
      borderActive: "border-amber-500 ring-2 ring-amber-300",
      borderIdle: "border-amber-300 bg-amber-50/60",
      itemHover: "hover:bg-amber-50 text-gray-900",
      itemActive: "bg-amber-100/80 text-amber-950 font-bold",
      checkIcon: "text-amber-700",
      focusRing: "focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-500",
    },
  };

  const currentTheme = themeStyles[colorTheme] || themeStyles.emerald;

  // Normalize items array
  const normalizedItems = items.map((item) => {
    if (typeof item === "string") {
      return {
        id: item,
        nameEn: item,
        nameHi: item,
        displayName: item,
        raw: item,
      };
    }
    const nameEn = item.nameEn || item.name || item.id || "";
    const nameHi = item.nameHi || item.name_hindi || nameEn;
    const cleanHi = (nameHi || "").replace(/\s*\([^)]*\)/g, "").trim();
    const cleanEn = (nameEn || "").replace(/\s*\([^)]*\)/g, "").trim();
    const displayName = item.displayName || (cleanHi && cleanEn && cleanHi !== cleanEn ? `${cleanHi} (${cleanEn})` : cleanHi || cleanEn || nameEn || nameHi);
    return {
      id: item.id || nameEn,
      nameEn: cleanEn || nameEn,
      nameHi: cleanHi || nameHi,
      displayName,
      subtitle: item.subtitle || (item.pincode ? `पिन: ${item.pincode}` : item.tehsil ? `तहसील: ${item.tehsil}` : item.block ? `ब्लॉक: ${item.block}` : ""),
      badge: item.badge || (item.pincode ? "✓ प्रमाणित" : ""),
      raw: item,
    };
  });

  // Filter items based on searchQuery (matches Hindi, English, and PIN)
  const q = searchQuery.trim().toLowerCase();
  const filteredItems = q
    ? normalizedItems.filter((item) => {
        const en = (item.nameEn || "").toLowerCase();
        const hi = (item.nameHi || "").toLowerCase();
        const disp = (item.displayName || "").toLowerCase();
        const sub = (item.subtitle || "").toLowerCase();
        return en.includes(q) || hi.includes(q) || disp.includes(q) || sub.includes(q);
      })
    : normalizedItems;

  // Find currently selected item display text
  let selectedDisplay = "";
  if (selectedItem) {
    if (typeof selectedItem === "string") {
      selectedDisplay = selectedItem.replace(/\s*\([^)]*\)/g, "").trim() || selectedItem;
    } else {
      const sEn = selectedItem.nameEn || selectedItem.name || "";
      const sHi = selectedItem.nameHi || sEn;
      const cleanHi = (sHi || "").replace(/\s*\([^)]*\)/g, "").trim();
      const cleanEn = (sEn || "").replace(/\s*\([^)]*\)/g, "").trim();
      selectedDisplay = cleanHi && cleanEn && cleanHi !== cleanEn ? `${cleanHi} (${cleanEn})` : cleanHi || cleanEn || sHi || sEn;
    }
  } else if (selectedValue) {
    const found = normalizedItems.find((it) => it.id === selectedValue || it.nameEn === selectedValue || it.nameHi === selectedValue);
    if (found) {
      selectedDisplay = found.displayName;
    } else {
      const cleanVal = (selectedValue || "").replace(/\s*\([^)]*\)/g, "").trim();
      selectedDisplay = cleanVal || selectedValue;
    }
  }

  const handleBoxClick = () => {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSelectItem = (item) => {
    onSelect?.(item.raw || item);
    setSearchQuery("");
    setOpen(false);
  };

  const handleClearClick = (e) => {
    e.stopPropagation();
    onClear?.();
    setSearchQuery("");
    setOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div
      ref={containerRef}
      className={`relative p-2.5 rounded-xl border transition-all select-none ${open ? "z-40" : "z-10"} ${
        disabled
          ? "bg-gray-100 border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
          : selectedValue
          ? currentTheme.borderIdle
          : currentTheme.borderActive
      }`}
    >
      {/* Box Header: Step badge, Label, and Count/Badge */}
      <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.5">
        <span className={`flex items-center space-x-1.5 ${disabled ? "text-gray-400" : currentTheme.labelText}`}>
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
              disabled ? "bg-gray-300 text-gray-600" : currentTheme.stepBadge
            }`}
          >
            {stepNumber}
          </span>
          <span className="truncate">{label}</span>
        </span>

        {badge && !disabled && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs shrink-0 ${currentTheme.topBadge}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Input / Display Field */}
      <div
        onClick={handleBoxClick}
        className={`relative flex items-center justify-between bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 shadow-2xs cursor-pointer transition-all ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "hover:border-gray-400"
        } ${currentTheme.focusRing}`}
      >
        {disabled ? (
          <span className="text-sm font-semibold text-gray-400 truncate py-0.5">{disabledText}</span>
        ) : selectedValue && !open ? (
          /* Selected Value Display View */
          <div className="flex items-center justify-between w-full min-w-0">
            <span className="text-base font-bold text-gray-900 truncate pr-1">
              {selectedDisplay}
            </span>
            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                onClick={handleClearClick}
                className="w-5 h-5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-600 flex items-center justify-center font-bold text-xs transition-colors"
                title="हटाएं / बदलें (Reset)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ) : (
          /* Search Input View */
          <div className="flex items-center w-full min-w-0">
            {loading ? (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0 mr-1.5" />
            ) : (
              <Search className="w-4 h-4 text-gray-400 shrink-0 mr-1.5" />
            )}
            <input
              ref={inputRef}
              type="text"
              disabled={disabled}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder={selectedValue ? selectedDisplay : placeholder}
              className="w-full text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal bg-transparent border-none outline-none p-0 cursor-text min-w-0"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                }}
                className="w-5 h-5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center shrink-0 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 ml-1 transition-transform ${open ? "rotate-180" : ""}`} />
            )}
          </div>
        )}
      </div>

      {/* Dropdown Options List: Visible when open === true */}
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-72 overflow-y-auto z-50 py-1 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
          {/* Quick count info strip */}
          <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
            <span>
              {q ? `खोज परिणाम: ${filteredItems.length}` : `उपलब्ध विकल्प: ${normalizedItems.length}`}
            </span>
            <span className="text-[10px] text-gray-400">स्क्रॉल या टाइप करें</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700">कोई परिणाम नहीं मिला</p>
              <p className="text-[11px] text-gray-400">"{searchQuery}" नाम का कोई विकल्प इस क्षेत्र में नहीं है।</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected =
                selectedValue &&
                (selectedValue === item.id ||
                  selectedValue === item.nameEn ||
                  selectedValue === item.nameHi);

              return (
                <div
                  key={item.id}
                  onMouseDown={(e) => {
                    // onMouseDown ensures instant click selection before any blur event
                    e.preventDefault();
                    handleSelectItem(item);
                  }}
                  className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? currentTheme.itemActive : currentTheme.itemHover
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-gray-900 block text-[13px] leading-tight">
                      {item.displayName}
                    </span>
                    {item.subtitle && (
                      <span className="text-[10px] text-gray-500 block mt-0.5 font-mono">
                        {item.subtitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {item.badge && (
                      <span className="text-[9.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-1.5 py-0.2 rounded">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className={`w-4 h-4 font-black ${currentTheme.checkIcon}`} />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
