const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Deploying CollaborationLog contract...");
    const CollaborationLog = await hre.ethers.getContractFactory("CollaborationLog");
    const contract = await CollaborationLog.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`CollaborationLog deployed to: ${address}`);

    // Save the deployed address and ABI to a file for the backend to use
    const deploymentInfo = {
        address,
        network: hre.network.name,
        deployedAt: new Date().toISOString(),
    };

    const deploymentPath = path.join(__dirname, "../deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to ${deploymentPath}`);

    // Also copy ABI
    const artifactPath = path.join(
        __dirname,
        "../artifacts/contracts/CollaborationLog.sol/CollaborationLog.json"
    );
    if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        const abiPath = path.join(__dirname, "../abi.json");
        fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
        console.log(`ABI saved to ${abiPath}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
