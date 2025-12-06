# Nushell script to install 7z on Windows

# Check if '7z' is already installed
if (which 7z | is-empty) {
    if (which scoop | is-empty) {
        print "Scoop is not installed. Please install Scoop first: https://scoop.sh/"
    } else {
        scoop install 7zip
    }
    error make { msg: "7z not found. Please install '7z' manually, as this script only uses Nushell and cannot install packages automatically." }
} else {
    print "7z is already installed."
}

if (which jq | is-empty) {
    if (which scoop | is-empty) {
        print "Scoop is not installed. Please install Scoop first: https://scoop.sh/"
    } else {
        scoop install jq
    }
    error make { msg: "jq not found. Please install 'jq' manually, as this script only uses Nushell and cannot install packages automatically." }
    exit
} else {
    print "jq is already installed."
}

# Use jq to get the version from package.json
let package_version = (jq -r ".version" package.json)
print $"Package version: ($package_version)"


$env.FIREFOX = ""
pnpm build
7z a $"dvsa-booker-chrome-($package_version).zip" "dist/."

$env.FIREFOX = "true"
pnpm build
7z a $"dvsa-booker-firefox-($package_version).zip" "dist/."
