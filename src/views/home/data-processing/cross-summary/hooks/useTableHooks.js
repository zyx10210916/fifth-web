export const useTableHooks = () => {
    function generateLetters(count) {
        const letters = [];
        for (let i = -1; i < count; i++) {
            const charCode = 65 + (i % 26);
            const repeats = Math.floor(i / 26);
            letters.push(String.fromCharCode(charCode).repeat(repeats + 1));
        }
        return letters;
    }
    function generateColumns(totalCount, mainColumnCount = 1) {
        const letters = generateLetters(totalCount);
        return letters.map((title, index) => {
            if (index === 0) {
                return {
                    title: '',
                    dataIndex: 'index',
                    key: 'index',
                    width: 60,
                    minWidth: 60,
                    fixed: 'left',
                    customCell: () => ({
                        style: {
                            background: 'rgba(245, 245, 247, 1)',
                            color: 'rgba(166, 166, 166, 1)',
                            textAlign: 'center',
                            fontSize: '1.6rem',
                        },
                    }),
                };
            }
            const isMainColumn = index <= mainColumnCount;
            if (isMainColumn) {
                return {
                    title,
                    dataIndex: title,
                    key: title,
                    width: 120,
                    minWidth: 120,
                    customCell: (record, rowIndex) => {
                        const cellValue = record[title];
                        const hasData = cellValue !== undefined && cellValue !== null && cellValue !== '';
                        const isHeaderRow = record.isHeader || rowIndex === 0;
                        if (hasData) {
                            return {
                                style: {
                                    ...(isHeaderRow
                                        ? {
                                            background: 'linear-gradient(0deg, rgba(181, 255, 246, 0.6), rgba(181, 255, 246, 0.6)), rgba(84, 111, 255, 1)',
                                            color: 'rgba(255, 255, 255, 1)',
                                        }
                                        :
                                            {
                                                background: 'linear-gradient(0deg, rgba(181, 255, 246, 0.6), rgba(181, 255, 246, 0.6)),  rgba(230, 233, 247, 1)',
                                                color: 'rgba(84,111,255,1)',
                                            }),
                                    fontSize: '1.6rem',
                                    textAlign: 'left',
                                },
                            };
                        }
                        return {
                            style: {
                                background: 'transparent',
                                color: 'transparent',
                            },
                            class: 'empty-cell'
                        };
                    },
                };
            }
            return {
                title,
                dataIndex: title,
                key: title,
                width: 100,
                minWidth: 100,
                customCell: (record, rowIndex) => {
                    const cellValue = record[title];
                    const hasData = cellValue !== undefined && cellValue !== null && cellValue !== '';
                    const isHeaderRow = record.isHeader || rowIndex === 0;
                    if (hasData) {
                        return {
                            style: {
                                ...(isHeaderRow
                                    ? {
                                        background: 'linear-gradient(0deg, rgba(181, 255, 246, 0.6), rgba(181, 255, 246, 0.6)), rgba(84, 111, 255, 1)',
                                        color: 'rgba(255, 255, 255, 1)',
                                        textAlign: 'center',
                                    }
                                    :
                                        {
                                            background: 'rgb(255,255,255)',
                                            textAlign: 'right'
                                        }),
                                fontSize: '1.6rem',
                            },
                        };
                    }
                    return {
                        style: {
                            background: 'transparent',
                            color: 'transparent',
                        },
                        class: 'empty-cell'
                    };
                },
            };
        });
    }
    return { generateColumns };
};
//# sourceMappingURL=useTableHooks.js.map