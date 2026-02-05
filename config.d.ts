export type Config = {
  dbUrl: string;
  currentUserName?: string;
};
type CommandHandler = (cmdName: string, ...args: string[]) => void;
