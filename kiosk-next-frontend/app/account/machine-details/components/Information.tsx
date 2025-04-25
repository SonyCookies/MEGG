"use client";

import { useState } from "react";
import {
    Monitor,
    Pencil,
    Fingerprint,
    Save,
} from "lucide-react";

export default function InformationPage() {
    const [isEditing, setIsEditing] = useState(false);
    const [machineName, setMachineName] = useState("MEGGatron-0421");

    const handleSave = () => {
        setIsEditing(false);
        // You could also call an API to persist the name here if needed
    };

    return (
        <div className="flex flex-col gap-6">
            {/* machine name */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-[#0e5f97]">
                    <Monitor className="w-5 h-5" />
                    <span className="text-lg font-medium">Machine Name</span>
                </div>
                <div className="p-2 pl-4 rounded-lg bg-white text-lg text-[#0e5f97] flex items-center gap-2 border border-[#0e5f97]/20 shadow-sm">
                    {/* machine name */}
                    {isEditing ? (
                        <input
                            type="text"
                            value={machineName}
                            onChange={(e) => setMachineName(e.target.value)}
                            autoFocus
                            className="flex-1 bg-transparent outline-none font-semibold"
                        />
                    ) : (
                        <span className="flex-1 font-semibold">{machineName}</span>
                    )}

                    {/* edit / save button */}
                    <button
                        onClick={isEditing ? handleSave : () => setIsEditing(true)}
                        className="p-3 bg-gray-300/20 transition-colors duration-300 hover:bg-gray-300/40 rounded-lg cursor-pointer"
                    >
                        {isEditing ? <Save className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* machine id */}
            <div className="flex flex-col gap-2 ">
                <div className="flex items-center gap-3 text-[#0e5f97]">
                    <Fingerprint className="w-5 h-5" />
                    <span className="text-lg font-medium">Machine ID</span>
                </div>
                <div className="p-4 rounded-lg bg-white text-lg text-[#0e5f97] border border-[#0e5f97]/20 shadow-sm">
                    <span className="font-semibold">MEGG-2025-019-145</span>
                </div>
            </div>
        </div>
    );
}
