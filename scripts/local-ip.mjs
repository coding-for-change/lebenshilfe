import os from "node:os";

for (const ifaces of Object.values(os.networkInterfaces())) {
  for (const iface of ifaces ?? []) {
    if (iface.family === "IPv4" && !iface.internal) {
      console.log(iface.address);
      process.exit(0);
    }
  }
}

console.log("127.0.0.1");
