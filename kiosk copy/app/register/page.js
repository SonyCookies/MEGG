import QRCode from "../register/components/QRCode";
import { generateMachineId } from "../../lib/utils";

export default function RegisterPage() {
  const machineId = generateMachineId();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Scan QR Code to Register</h1>
      <QRCode value={machineId} />
      <p className="mt-4">Machine ID: {machineId}</p>
    </div>
  );
}
