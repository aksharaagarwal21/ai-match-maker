// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CollaborationLog {
    struct Contribution {
        string projectId;
        string summaryHash;
        string ipfsHash;
        address[] contributors;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => Contribution) private contributions;
    string[] private allProjectIds;

    event ContributionLogged(
        string indexed projectId,
        string summaryHash,
        string ipfsHash,
        address[] contributors,
        uint256 timestamp
    );

    function logContribution(
        string memory _projectId,
        string memory _summaryHash,
        string memory _ipfsHash,
        address[] memory _contributors
    ) public {
        require(bytes(_projectId).length > 0, "Project ID required");
        require(bytes(_summaryHash).length > 0, "Summary hash required");

        if (!contributions[_projectId].exists) {
            allProjectIds.push(_projectId);
        }

        contributions[_projectId] = Contribution({
            projectId: _projectId,
            summaryHash: _summaryHash,
            ipfsHash: _ipfsHash,
            contributors: _contributors,
            timestamp: block.timestamp,
            exists: true
        });

        emit ContributionLogged(
            _projectId,
            _summaryHash,
            _ipfsHash,
            _contributors,
            block.timestamp
        );
    }

    function getContribution(string memory _projectId)
        public
        view
        returns (
            string memory summaryHash,
            string memory ipfsHash,
            address[] memory contributors,
            uint256 timestamp
        )
    {
        require(contributions[_projectId].exists, "No contribution found");
        Contribution memory c = contributions[_projectId];
        return (c.summaryHash, c.ipfsHash, c.contributors, c.timestamp);
    }

    function verifyContribution(string memory _projectId, string memory _hash)
        public
        view
        returns (bool)
    {
        if (!contributions[_projectId].exists) return false;
        return keccak256(bytes(contributions[_projectId].summaryHash)) == keccak256(bytes(_hash));
    }

    function getTotalProjects() public view returns (uint256) {
        return allProjectIds.length;
    }
}
