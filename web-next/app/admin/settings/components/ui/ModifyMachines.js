"use client";

import { useState } from "react";
import { Trash2, X, Settings } from "lucide-react";
import Image from "next/image";

const mockMachinesData = [
  {
    id: "001",
    name: "Machine-001",
    addedDate: "01/01/2024",
    image: "/default.png",
  },
  {
    id: "002",
    name: "Machine-002",
    addedDate: "02/01/2024",
    image: "/default.png",
  },
  {
    id: "003",
    name: "Machine-003",
    addedDate: "03/01/2024",
    image: "/default.png",
  },
];

export default function ModifyMachines() {
  const [machines, setMachines] = useState(mockMachinesData);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [machineName, setMachineName] = useState("");
  const [pin, setPin] = useState("");

  const openEditModal = (machine) => {
    setSelectedMachine(machine);
    setMachineName(machine.name);
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    setMachines((prevMachines) =>
      prevMachines.map((m) =>
        m.id === selectedMachine.id ? { ...m, name: machineName } : m
      )
    );
    setIsEditModalOpen(false);
  };

  const openConfirmModal = () => {
    setIsConfirmModalOpen(true);
  };

  const handleDelete = () => {
    if (pin.length === 6) {
      setMachines((prevMachines) =>
        prevMachines.filter((m) => m.id !== selectedMachine.id)
      );
      setIsConfirmModalOpen(false);
      setIsEditModalOpen(false);
    }
  };

  return (
    <>
      <form className="border-l flex flex-1 flex-col gap-10 lg:gap-8 p-8 bg-white xl:bg-none rounded-2xl xl:rounded-none shadow-md xl:shadow-none w-full">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-medium">Modify Machines</h3>
            <span className="text-gray-500 text-sm">
              Handles the registration and management of egg sorting machines.
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {machines.map((machine) => (
              <button
                key={machine.id}
                type="button"
                className="col-span-4 lg:col-span-2 rounded-lg border p-4 flex items-center cursor-pointer hover:bg-gray-300/30 transition-colors duration-150"
                onClick={() => openEditModal(machine)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative rounded-full w-20 h-20 border border-blue-500 overflow-hidden">
                    <Image
                      src={machine.image}
                      alt={machine.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="flex flex-col gap-1 items-start">
                    <h1 className="font-medium text-l">{machine.name}</h1>
                    <span className="text-gray-500 text-sm">
                      Added: {machine.addedDate}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40 p-4">
          <div className="p-6 lg:p-8 bg-white border rounded-2xl z-50 w-full max-w-md flex flex-col gap-6 relative">
            <div className="flex flex-col items-center gap-4">
              <Settings className="w-12 h-12 text-blue-500" />

              <div className="flex flex-col gap-1 text-center">
                <h2 className="text-xl font-semibold text-rd-600 ">
                  Edit machine
                </h2>
                <p className="text-gray-500 text-sm">
                  Modify your machine's name
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-300/20"
            >
              <X className="w-5 h-5" />
            </button>

            <input
              type="text"
              className="border rounded-lg px-4 py-2 w-full outline-none focus:border-blue-600"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              placeholder="Enter machine's name"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={openConfirmModal}
                className="px-4 py-2 rounded-lg border border-red-600 text-red-600 transition-colors duration-150 hover:bg-red-600 hover:text-white w-full "
              >
                Delete
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 w-full"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40 p-4">
          <div className="p-6 lg:p-8 bg-white rounded-2xl shadow-lg z-50 w-full max-w-md flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-4">
                <Trash2 className="w-12 h-12 text-red-600" />

                <div className="flex flex-col gap-1 text-center">
                  <h2 className="text-xl font-semibold text-rd-600 ">
                    Remove machine
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Are you sure you want to remove this machine?
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6 bg-red-0 w-full">
                <div className="flex flex-col gap-1">
                  <label htmlFor="fullname">Enter 6-digit pin.</label>

                  <input
                    type="password"
                    className="border rounded-lg px-4 py-2 w-full outline-none focus:border-red-600"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter your 6-digit pin"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="px-4 py-2 rounded-lg border hover:bg-gray-300/20 w-full"
                  >
                    Cancel
                  </button>

                  <button
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 w-full"
                    disabled={pin.length !== 6}
                    onClick={handleDelete}
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}