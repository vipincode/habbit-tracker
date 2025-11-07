declare module "custom-env" {
  interface CustomEnv {
    env(environment?: string, path?: string): void;
  }

  const customEnv: CustomEnv;
  export = customEnv;
}
