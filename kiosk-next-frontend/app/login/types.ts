// app/login/types.ts

export type InputMode = "machineId" | "pin";
export type MachineIdPart = "year" | "series" | "unit";

export interface LoginState {
  isLoaded: boolean;
  machineId: string;
  savedMachineId: string;
  showSavedModal: boolean;
  pin: string;
  loading: boolean;
  error: string;
  success: string;
  inputMode: InputMode;
  machineIdPart: MachineIdPart;
  yearInput: string;
  seriesInput: string;
  unitInput: string;
  isMachineIdFocused: boolean;
  showVerifyModal: boolean;
  showPinErrorModal: boolean;
}
