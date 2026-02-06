package com.example.main_service.sharedAttribute.commonDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PageResult<TEntity> {
    public void setData(List<TEntity> data) {
        this.data = data;
        this.totalCount = data == null ? 0 : data.size();
    }

    private long totalCount;
    private List<TEntity> data;
}
