"use client";
import { useState } from "react";
import { Save } from "lucide-react";

export default function ChangePassword() {
  const [globalMessage, setGlobalMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(
    false
  );

  const validate = (name, value) => {
    let validationErrors = { ...errors };

    if (name === "newPassword") {
      validationErrors.newPassword =
        value.length < 8 ? "Password must be at least 8 characters long." : "";
    }

    if (name === "confirmPassword") {
      validationErrors.confirmPassword =
        value !== formData.newPassword ? "Passwords do not match." : "";
    }

    setErrors(validationErrors);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    validate(name, value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    let validationErrors = {};

    if (formData.newPassword.length < 8) {
      validationErrors.newPassword =
        "Password must be at least 8 characters long.";
    }

    if (formData.confirmPassword !== formData.newPassword) {
      validationErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setGlobalMessage("Password updated successfully!");
      setTimeout(() => {
        setGlobalMessage("");
      }, 3000);
    }
  };

  return (
    <>
      <form className="border-l flex flex-1 flex-col gap-10 lg:gap-8 p-8 bg-white border xl:border-none xl:bg-none rounded-2xl xl:rounded-none shadow xl:shadow-none w-full">
        {/* Global validation message */}
        {globalMessage && (
          <div
            className={`border-l-4 rounded-lg px-4 py-2 w-full  ${
              globalMessage.includes("successful")
                ? "bg-green-100 border-green-500 text-green-500"
                : "bg-red-100 border-red-500 text-red-500"
            }`}
          >
            {globalMessage}
          </div>
        )}

        {/* Notifications */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between  gap-6 sm:gap-0">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-medium">Notifications</h3>
                <span className="text-gray-500 text-sm">
                  Enable your preferred notifications.
                </span>
              </div>

              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={() =>
                    setNotificationsEnabled(!notificationsEnabled)
                  }
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {notificationsEnabled && (
              <div className="flex flex-col xl:flex-row gap-4 xl:gap-8">
                <div className="w-full bg-gray-300/20 text-sm mb-4 xl:mb-0 p-6 rounded-lg">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-lg">Email notifications</p>
                        <span className="text-gray-500">
                          Users receive alerts via email for important events
                        </span>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-lg">In-app notifications</p>
                        <span className="text-gray-500">
                          Users receive alerts in-app for important events
                        </span>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Push Notifications */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between  gap-6 sm:gap-0">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-medium">Push notifications</h3>
                <span className="text-gray-500 text-sm">
                  Users can toggle push notifications on or off.
                </span>
              </div>

              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushNotificationsEnabled}
                  onChange={() =>
                    setPushNotificationsEnabled(!pushNotificationsEnabled)
                  }
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {pushNotificationsEnabled && (
              <div className="flex flex-col xl:flex-row gap-4 xl:gap-8">
                <div className="w-full bg-gray-300/20 text-sm mb-4 xl:mb-0 p-6 rounded-lg">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-lg">Defect alerts</p>
                        <span className="text-gray-500">
                          Users receive alerts of defected eggs
                        </span>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-lg">Machine alerts</p>
                        <span className="text-gray-500">
                          Users receive alerts of machines activity
                        </span>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  );
}