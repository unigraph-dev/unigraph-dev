# This nix expression re-packages the AppImage version of Unigraph for NixOS.
#
# It can be directly build from GitHub
#    $ nix-build github:unigraph-dev/unigraph-dev
#    $ ls -l $PWD/result/bin

with import <nixpkgs> {};

let
  pname = "unigraph";
  name = "${pname}-${version}";
  version = "0.2.9";
  
  src = builtins.fetchurl {
    url =
      "https://github.com/unigraph-dev/unigraph-dev/releases/download/v${version}/Unigraph-${version}.AppImage";
    sha256 = {
      "0.2.9" = "976f60304a8c03c96cf662bc5f4d064e2e65f5bc8e9f5a13a92c7be7b940fb44";
      "0.2.8" = "509b4b5cfe69f348410be5ff7babd44d12a0f52c76217b89f6a7101f51a92abd";
      "0.2.7" = "0ccfa292a09cacf9491e2378fd64631ab08cadbc4d246a12a752b85146947fb6";
      "0.2.5" = "72262d6fd13cf1b395e0c39d776f925264d0d60438ef7e155e54f8a67e78cb9f";
    }."${version}";
  };

  appimageContents = pkgs.appimageTools.extractType2 { inherit name src; };

in pkgs.appimageTools.wrapType2 rec {
  inherit name src;

  extraInstallCommands = ''
    ln -s "$out/bin/${name}" "$out/bin/${pname}"

    # Install Desktop entry files
    install -m 444 -D ${appimageContents}/unigraph-dev-electron.desktop $out/share/applications/unigraph-dev-electron.desktop

    # Iterate over icons and copy them to out, dynamically
    mkdir -p $out/share/icons/hicolor
    for icon_file in $(find ${appimageContents}/usr/share/icons/hicolor -name unigraph-dev-electron.png); do
      # sed erases the appimageContents path
      install -m 444 -D $icon_file $out/share/icons/$(echo $icon_file | sed 's/.*hicolor/hicolor/')
    done
  '';

  meta = with lib; {
    description = ''
      Unigraph is local-first, knowledge graph based productivity tool.
    '';

    longDescription = ''
      Unigraph is local-first and universal knowledge graph, personal search engine,
      and workspace for your life.
    ''; # adapted from https://github.com/unigraph-dev/unigraph-dev

    homepage = "https://unigraph.dev";
    license = licenses.mit;
    maintainers = with maintainers; [ dantefromhell ];
    platforms = [ "x86_64-linux" ];
  };
}
