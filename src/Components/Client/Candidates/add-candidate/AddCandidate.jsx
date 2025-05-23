import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import useAllJobs from "../../../../hooks/useFetchAllJobs";
import {
  CANDIDATE_SOURCE,
  SPECIALIZATIONS,
} from "../../../Constants/constants";
import { useMutation } from "@tanstack/react-query";
import { parseResume } from "../api";
import UploadProgress from "./UploadProgress";
import toast from "react-hot-toast";
import {
  ResumeTable,
  UploadButton,
} from "./AddCandidateComponents";
import { FilterGroup } from "../components/FilterGroup";
import { useUploadProgress } from "./useUploadProgress";
import { useLocation } from "react-router-dom";

// constants
const MAX_BULK_FILES = 15;

function ClientAddCandidate() {
  // Get location to access route state
  const location = useLocation();
  const selectedJob = location.state?.selectedJob;
  const { data: roles } = useAllJobs();
  const {
    isUploading,
    uploadProgress,
    startProgress,
    stopProgress,
    resetProgress,
    setUploadProgress,
  } = useUploadProgress();

  // Refs
  const uploadCVRef = useRef(null);
  const uploadBulkCVRef = useRef(null);

  // State
  const [filesMap, setFilesMap] = useState(new Map());
  const [filters, setFilters] = useState({
    role: selectedJob?.id || "", // Prefill with selected job id if available
    specialization: selectedJob?.function || "",
    source: "INT",
  });
  // Add isDiversityHiring state
  const [isDiversityHiring, setIsDiversityHiring] =
    useState(selectedJob?.is_diversity_hiring || false);
  const [resumeTableData, setResumeTableData] = useState(
    []
  );
  const [editingRowId, setEditingRowId] = useState(null);
  const [
    isSpecializationDisabled,
    setIsSpecializationDisabled,
  ] = useState(!!selectedJob?.function);

  useEffect(() => {
    if (selectedJob?.id) {
      setFilters((prev) => ({
        ...prev,
        role: selectedJob.id,
        specialization:
          selectedJob.function || prev.specialization,
      }));

      // Set diversity hiring from selected job if available
      setIsDiversityHiring(
        !!selectedJob.is_diversity_hiring
      );

      if (selectedJob.function) {
        setIsSpecializationDisabled(true);
      }
    }
  }, [selectedJob]);

  useEffect(() => {
    if (!filters.role || selectedJob?.id) return;

    const selectedRoleData = roles?.find(
      (role) => role.id === filters.role
    );

    if (
      selectedRoleData &&
      selectedRoleData.specialization
    ) {
      setFilters((prev) => ({
        ...prev,
        specialization: selectedRoleData.specialization,
      }));
      setIsSpecializationDisabled(true);

      // Update diversity hiring based on selected role
      setIsDiversityHiring(
        !!selectedRoleData.is_diversity_hiring
      );
    } else {
      setIsSpecializationDisabled(false);
    }
  }, [filters.role, roles, selectedJob]);

  // Derived state
  const isUploadButtonDisabled =
    !filters.role ||
    !filters.specialization ||
    !filters.source;

  // Filter handlers

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));

    // When changing role, update diversity hiring status
    if (filterType === "role") {
      const selectedRoleData = roles?.find(
        (role) => role.id === value
      );
      setIsDiversityHiring(
        !!selectedRoleData?.is_diversity_hiring
      );
    }
  };

  const { mutate: parseResumeMutation } = useMutation({
    mutationFn: (formdata) =>
      parseResume(formdata, setUploadProgress),
    onMutate: startProgress,
    onSuccess: (data) => {
      stopProgress();
      setUploadProgress(100);
      setTimeout(resetProgress, 0);
      if (data.data.length === 0) {
        toast.error("Error parsing resume.");
        return;
      }
      const dataWithId = data.data.map((row, index) => ({
        ...row,
        id: generateUniqueId(),
        file: filesMap.get(index),
      }));
      setResumeTableData(dataWithId);

      // Only include gender in validation if diversity hiring is enabled
      const incompleteResumes = dataWithId.filter(
        (row) =>
          !row.name ||
          !row.email ||
          !row.phone_number ||
          !row.current_company ||
          !row.current_designation ||
          (row.years_of_experience.year === 0 &&
            row.years_of_experience.month === 0) ||
          (isDiversityHiring && !row.gender) // Only check gender if diversity hiring is enabled
      );

      if (incompleteResumes.length > 0) {
        toast.error(
          `${incompleteResumes.length} resume(s) require manual editing. Please check the highlighted fields.`,
          { duration: 5000 }
        );
      }
      toast(
        <span>
          Please review the experience values as they may
          require verification or correction.
        </span>,
        {
          icon: "⚠️",
        }
      );
    },
    onError: (error) => {
      stopProgress();
      resetProgress();
      toast.error("Error parsing resume");
      console.error("Error parsing resume", error);
    },
    onSettled: stopProgress,
  });

  // Helper functions

  const generateUniqueId = () =>
    `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

  const createFilesMap = (filesArray) => {
    const newFilesMap = new Map();
    filesArray.forEach((file, index) =>
      newFilesMap.set(index, file)
    );
    return newFilesMap;
  };

  // File upload handlers

  const handleFileUpload = useCallback(
    (files) => {
      const formdata = new FormData();
      const filesArray = Array.isArray(files)
        ? files
        : [files];

      // Check if bulk upload exceeds the maximum file limit
      if (filesArray.length > MAX_BULK_FILES) {
        toast.error(
          `You can only upload a maximum of ${MAX_BULK_FILES} files at once.`
        );
        // Reset the file input
        if (filesArray.length > 1) {
          uploadBulkCVRef.current.value = "";
        } else {
          uploadCVRef.current.value = "";
        }
        return;
      }

      filesArray.forEach((file) =>
        formdata.append("resume", file)
      );

      const newFilesMap = createFilesMap(filesArray);
      setFilesMap(newFilesMap);
      setResumeTableData([]);

      parseResumeMutation(formdata);
    },
    [parseResumeMutation]
  );

  const handleSingleFileUpload = () =>
    uploadCVRef.current?.click();
  const handleBulkFileUpload = () =>
    uploadBulkCVRef.current?.click();

  return (
    <div>
      <div className="pl-3 space-y-2">
        <div className="flex flex-col space-y-2">
          <FilterGroup
            label="Role"
            options={roles}
            selectedOption={filters.role}
            onSelect={(value) =>
              handleFilterChange("role", value)
            }
            disabled={!!selectedJob?.id}
          />
          <FilterGroup
            label="Function"
            options={SPECIALIZATIONS}
            selectedOption={filters.specialization}
            onSelect={(value) =>
              handleFilterChange("specialization", value)
            }
            disabled={isSpecializationDisabled}
          />
          <FilterGroup
            label="Source"
            options={CANDIDATE_SOURCE}
            selectedOption={filters.source}
            onSelect={(value) =>
              handleFilterChange("source", value)
            }
            disabled={true}
          />
        </div>
      </div>

      <div className="w-full flex mt-6 gap-32">
        <input
          type="file"
          ref={uploadCVRef}
          className="hidden"
          accept=".pdf"
          onChange={(e) =>
            handleFileUpload(e.target.files[0])
          }
        />
        <UploadButton
          label="Upload CV"
          onClick={handleSingleFileUpload}
          disabled={isUploadButtonDisabled}
        />
        <input
          type="file"
          ref={uploadBulkCVRef}
          className="hidden"
          accept=".pdf"
          multiple={true}
          onChange={(e) =>
            handleFileUpload(Array.from(e.target.files))
          }
        />
        <UploadButton
          label="Bulk Upload CV"
          onClick={handleBulkFileUpload}
          disabled={isUploadButtonDisabled}
        />
      </div>

      <UploadProgress
        isUploading={isUploading}
        progress={uploadProgress}
      />

      {resumeTableData?.length > 0 && (
        <ResumeTable
          data={resumeTableData}
          setData={setResumeTableData}
          editingRowId={editingRowId}
          setEditingRowId={setEditingRowId}
          selectedSource={filters.source}
          selectedRole={filters.role}
          selectedSpecialization={filters.specialization}
          isDiversityHiring={isDiversityHiring} // Pass isDiversityHiring prop to ResumeTable
        />
      )}
    </div>
  );
}

export default ClientAddCandidate;
