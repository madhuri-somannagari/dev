import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useMemo } from "react";
import {getJobLabel} from '../../../../utils/util'
import GreenStepper from "./GreenStepper";
import CustomMenu from "./CustomMenu";
import { ENAGAGEMENT_STATUS } from "../constants";

import { findAllSteps } from "../utils";

const TimelineContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 5px",
  backgroundColor: "white",

  borderTop: "1px solid #E5E7EB",
  "&:last-child": {
    borderBottom: "1px solid #E5E7EB",
  },
});

const CandidateInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  minWidth: "200px",
  gap: "6px",
  textTransform: "uppercase",
  "& .candidate-initials": {
    fontSize: "12px",
    fontWeight: 600,
    color: "#056DDC",
    lineHeight: 1,
  },
  "& .candidate-details": {
    display: "flex",
    gap: "14px",
    alignItems: "center",

    "& .role": {
      fontSize: "11px",
      color: "#000000",
      marginRight: "8px",
    },
    "& .type": {
      fontSize: "11px",
      color: "#000000",
    },
  },
});

const CandidateTimeline = ({
  engagement,
  onStatusChange,
  isUpdating,
  onEngagementClick = () => { },
  org_id,
}) => {
  const steps = useMemo(
    () => findAllSteps(engagement?.engagementoperations),
    [engagement?.engagementoperations]
  );

  const engagementStatus = useMemo(
    () =>
      ENAGAGEMENT_STATUS.find((s) => s.value === engagement?.status) ||
      ENAGAGEMENT_STATUS[0],
    [engagement?.status]
  );

  return (
    <TimelineContainer>
      <CandidateInfo
        onClick={() => (onEngagementClick && !org_id) && onEngagementClick(engagement)}
        className={(onEngagementClick && !org_id) ? "cursor-pointer" : ""}
      >
        <Typography className="candidate-initials">
          {engagement?.candidate_name}
        </Typography>
        <Box className="candidate-details">
          <Typography className="role">
            {getJobLabel(engagement?.job?.name)}
          </Typography>
          <Typography className="type">internal</Typography>
        </Box>
      </CandidateInfo>

      <Box sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
        <GreenStepper steps={steps} />
      </Box>

      {org_id ?
        <button 
        className={`cursor-default px-4 py-2 rounded-[100px] border text-xs font-semibold`} 
        style={{ color: engagementStatus?.color || "#65558F", borderColor: engagementStatus?.color || "#79747E" }}
        >
          {engagementStatus?.label}
        </button> : <CustomMenu
          options={ENAGAGEMENT_STATUS}
          selectedOption={engagementStatus}
          setSelectedOption={(opt) => {
            onStatusChange(opt.value);
          }}
          isUpdating={isUpdating}
        />}
    </TimelineContainer>
  );
};

export default CandidateTimeline;

CandidateTimeline.propTypes = {
  engagement: PropTypes.object,
  onStatusChange: PropTypes.func,
  isUpdating: PropTypes.bool,
  onEngagementClick: PropTypes.func,
  org_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
