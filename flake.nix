{
  description = "clinab — A delightful CLI for You Need A Budget (YNAB)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # Fixed-output derivation: allowed to access the network because
        # its output is verified by content hash.  Re-run
        #   nix build .#default 2>&1 | grep 'got:'
        # after changing dependencies to obtain the new hash.
        bunDeps = pkgs.stdenvNoCC.mkDerivation {
          pname = "clinab-deps";
          version = "0.1.0";
          src = pkgs.lib.cleanSource ./.;

          nativeBuildInputs = [ pkgs.bun pkgs.cacert ];

          dontFixup = true;

          buildPhase = ''
            runHook preBuild
            export HOME=$(mktemp -d)
            bun install --frozen-lockfile --no-progress
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            cp -r node_modules $out
            runHook postInstall
          '';

          outputHashAlgo = "sha256";
          outputHashMode = "recursive";
          outputHash = "sha256-t3O0NCbfBv9VdcYenM1DVEnW55D4cicKbC1yHIHfj5A=";
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs_22
            jq
          ];

          shellHook = ''
            echo "clinab dev shell ready (bun $(bun --version))"

            # Load YNAB token from agenix if available
            if [ -f /run/agenix/ynab-token ]; then
              export YNAB_TOKEN=$(cat /run/agenix/ynab-token)
            fi
          '';
        };

        packages.default = pkgs.stdenvNoCC.mkDerivation {
          pname = "clinab";
          version = "0.1.0";
          src = pkgs.lib.cleanSource ./.;

          nativeBuildInputs = [ pkgs.bun pkgs.makeWrapper ];

          dontBuild = true;

          installPhase = ''
            runHook preInstall
            mkdir -p $out/lib/clinab $out/bin

            cp -r src package.json bun.lock $out/lib/clinab/
            cp -r ${bunDeps} $out/lib/clinab/node_modules

            makeWrapper ${pkgs.bun}/bin/bun $out/bin/clinab \
              --add-flags "run $out/lib/clinab/src/index.ts" \
              --set NODE_ENV production
            runHook postInstall
          '';

          meta = with pkgs.lib; {
            description = "A delightful CLI for You Need A Budget (YNAB)";
            homepage = "https://github.com/bagleymj/clinab";
            license = licenses.mit;
            mainProgram = "clinab";
          };
        };
      });
}
