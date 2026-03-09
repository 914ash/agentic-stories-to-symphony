export interface PromptChoice<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export interface PromptIO {
  input(message: string, initialValue?: string): Promise<string>;
  multiline(message: string, initialValue?: string): Promise<string>;
  select<T extends string>(message: string, choices: PromptChoice<T>[]): Promise<T>;
  confirm(message: string, initialValue?: boolean): Promise<boolean>;
  renderStatus(message: string): void;
}
