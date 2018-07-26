
class KeyNode {

    constructor (name) {
        this.name   = name;
        this.subkeys = [];
        this.values  = {};
    }

    add_subkey (name) {

        let subkey_name_exists = this.subkeys.some((k) => {
            return k.name.toLowerCase() === name.toLowerCase();
        });

        if (subkey_name_exists) {
            throw new Error(`Cannot add ${name} - subkey already exists."`);
        }

        this.subkeys.push(new KeyNode(name));
    }

    add_value (key, value) {

        const existing_key = Object.keys(this.values).filter(
            k => k.toLowerCase === key.toLowerCase()
        ).pop();

        if (existing_key) {
            delete this.values[existing_key];
        }

        this.values[key] = value;
    }
}


class VirtualRegistry {

    constructor (context) {
        this.context = context;

        this.hklm = new KeyNode("HKEY_LOCAL_MACHINE");
        this.hkcu = new KeyNode("HKEY_CURRENT_USER");
    }

    _parse_path (path) {
        // Assume that the path is already an array, meaning we don't
        // litter all methods with tests about whether the path has
        // been parsed already.
        if (Array.isArray(path)) return path;

        let path_parsed = path.split("\\");
        return path_parsed;
    }

    _resolve_key (path) {

        console.log("attempting to resolve", path);


    }

    // Read
    // ====
    //
    // Given a path to a registry entry, attempts to return the
    // associated registry value.  If the path ends in a backslash,
    // `Read' returns the key's default value, else it reads the named
    // value.
    //
    read (path) {

    }

    write (path, value) {
        console.log("VREG [writing] =>", value, "to", path);
    }

    delete (path) {

    }

}

module.exports = VirtualRegistry;
