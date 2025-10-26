export interface ExtraData {
  name?: string;
  verificationFile?: {
    uri: string;
    name: string;
    size: number;
  };
  [key: string]: any;
}

export declare function signUp(
  email: string,
  password: string,
  role: string,
  extrData?: ExtraData
): Promise<any>;

export declare function signIn(email: string, password: string): Promise<any>;

export declare function logOut(): Promise<void>;

export declare function authStateListener(callback: (user: any) => void): () => void;
