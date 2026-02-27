{
  description = "clinab — CLI for You Need A Budget";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
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

        packages.default = pkgs.stdenv.mkDerivation {
          pname = "clinab";
          version = "0.1.0";
          src = ./.;

          nativeBuildInputs = [ pkgs.bun pkgs.makeWrapper ];

          buildPhase = ''
            export HOME=$(mktemp -d)
            bun install --frozen-lockfile
          '';

          installPhase = ''
            mkdir -p $out/lib/clinab $out/bin
            cp -r src node_modules package.json $out/lib/clinab/
            makeWrapper ${pkgs.bun}/bin/bun $out/bin/clinab \
              --add-flags "run $out/lib/clinab/src/index.ts"
          '';
        };
      });
}
