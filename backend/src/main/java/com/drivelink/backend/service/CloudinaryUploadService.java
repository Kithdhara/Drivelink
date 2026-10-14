package com.drivelink.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Shared Cloudinary upload service.
 * Replaces all local disk saves (uploads/applications, uploads/renewals, uploads/tickets).
 * Returns a public HTTPS URL that can be stored directly in the DB.
 */
@Service
public class CloudinaryUploadService {

    private final Cloudinary cloudinary;

    public CloudinaryUploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    /**
     * Upload a file to Cloudinary under the given folder and return its secure URL.
     *
     * @param file   the multipart file to upload
     * @param folder e.g. "drivelink/applications", "drivelink/renewals", "drivelink/tickets"
     * @return the public HTTPS URL of the uploaded file
     */
    public String upload(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) return null;

        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", "auto"   // handles PDFs, images, etc.
                )
        );
        return (String) result.get("secure_url");
    }
}
